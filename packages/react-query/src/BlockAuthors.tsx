// Copyright 2017-2020 @canvas-ui/react-query authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EraRewardPoints } from '@polkadot/types/interfaces';

import React, { useEffect, useState } from 'react';
import { HeaderExtended } from '@polkadot/api-derive';
import { useApi, useCall } from '@canvas-ui/react-hooks';
import { formatNumber } from '@polkadot/util';
import keyring from "@polkadot/ui-keyring";

export interface Authors {
  byAuthor: Record<string, string>;
  eraPoints: Record<string, string>;
  lastBlockAuthors: string[];
  lastBlockNumber?: string;
  lastHeader?: HeaderExtended;
  lastHeaders: HeaderExtended[];
}

interface Props {
  children: React.ReactNode;
}

const MAX_HEADERS = 50;

const byAuthor: Record<string, string> = {};
const eraPoints: Record<string, string> = {};
const BlockAuthorsContext: React.Context<Authors> = React.createContext<Authors>({ byAuthor, eraPoints, lastBlockAuthors: [], lastHeaders: [] });
const ValidatorsContext: React.Context<string[]> = React.createContext<string[]>([]);

function BlockAuthorsBase ({ children }: Props): React.ReactElement<Props> {
  const { api, isApiReady } = useApi();
  const queryPoints = useCall<EraRewardPoints>(isApiReady && api.derive.staking?.currentPoints, []);
  const [state, setState] = useState<Authors>({ byAuthor, eraPoints, lastBlockAuthors: [], lastHeaders: [] });
  const [validators, setValidators] = useState<string[]>([]);

  useEffect((): void => {
    // No unsub, global context - destroyed on app close
    api.isReady.then((): void => {
      let lastHeaders: HeaderExtended[] = [];
      let lastBlockAuthors: string[] = [];
      let lastBlockNumber = '';

      // subscribe to all validators
      api.query.session && api.query.session.validators((validatorIds): void => {
        setValidators(validatorIds.map((validatorId) => validatorId.toString()));
      }).catch(console.error);

      // subscribe to new headers
      api.derive.chain.subscribeNewHeads(async (lastHeader): void => {
        if (lastHeader?.number) {
          const blockNumber = lastHeader.number.unwrap();
          const thisBlockAuthor = lastHeader.author?.toString();
          const thisBlockNumber = formatNumber(blockNumber);
          const chainName = (await api.rpc.system.chain()).toString()
          const systemName = (await api.rpc.system.version()).toString()

          // @ts-ignore
          const [currentBlockIndex] = blockNumber.words;
          if (
            ((window.localStorage.getItem('chainName') || chainName) !== chainName) ||
            ((window.localStorage.getItem('systemName') || systemName) !== systemName) ||
            (parseInt(window.localStorage.getItem('currentBlockIndex') || '0') > currentBlockIndex)
          ) {
            const resetConfirm = confirm('It seems your currently running chain and the UI artifacts are out of sync.\n' +
              '\n' +
              'This can happen after purging a chain or switching the chain to another.\n' +
              'If this is the case please click [OK] in order to reset your UI.')
            if (resetConfirm) {
              const existingContractList = keyring.getContracts()
              existingContractList.forEach(existingContract => {
                keyring.forgetContract(existingContract.address.toString());
              })
            }
          }
          window.localStorage.setItem('currentBlockIndex', currentBlockIndex);
          window.localStorage.setItem('chainName', chainName);
          window.localStorage.setItem('systemName', systemName);

          if (thisBlockAuthor) {
            byAuthor[thisBlockAuthor] = thisBlockNumber;

            if (thisBlockNumber !== lastBlockNumber) {
              lastBlockNumber = thisBlockNumber;
              lastBlockAuthors = [thisBlockAuthor];
            } else {
              lastBlockAuthors.push(thisBlockAuthor);
            }
          }

          lastHeaders = lastHeaders
            .filter((old, index): boolean => index < MAX_HEADERS && old.number.unwrap().lt(blockNumber))
            .reduce((next, header): HeaderExtended[] => {
              next.push(header);

              return next;
            }, [lastHeader])
            .sort((a, b) => b.number.unwrap().cmp(a.number.unwrap()));

          setState({ byAuthor, eraPoints, lastBlockAuthors: lastBlockAuthors.slice(), lastBlockNumber, lastHeader, lastHeaders });
        }
      }).catch(console.error);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect((): void => {
    if (queryPoints) {
      const entries = [...queryPoints.individual.entries()]
        .map(([accountId, points]) => [accountId.toString(), formatNumber(points)]);
      const current = Object.keys(eraPoints);

      // we have an update, clear all previous
      if (current.length !== entries.length) {
        current.forEach((accountId): void => {
          delete eraPoints[accountId];
        });
      }

      entries.forEach(([accountId, points]): void => {
        eraPoints[accountId] = points;
      });
    }
  }, [queryPoints]);

  return (
    <ValidatorsContext.Provider value={validators}>
      <BlockAuthorsContext.Provider value={state}>
        {children}
      </BlockAuthorsContext.Provider>
    </ValidatorsContext.Provider>
  );
}

const BlockAuthors = React.memo(BlockAuthorsBase);

export { BlockAuthorsContext, BlockAuthors, ValidatorsContext };
