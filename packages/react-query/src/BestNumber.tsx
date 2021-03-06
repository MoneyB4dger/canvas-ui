// Copyright 2017-2021 @canvas-ui/react-query authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BareProps } from '@canvas-ui/react-api/types';
import { useApi, useCall } from '@canvas-ui/react-hooks';
import React from 'react';

import { BlockNumber } from '@polkadot/types/interfaces';
import { formatNumber } from '@polkadot/util';

interface Props extends BareProps {
  children?: React.ReactNode;
  label?: React.ReactNode;
  withPound?: boolean;
}

function BestNumber ({ children, className = '', label, withPound }: Props): React.ReactElement<Props> {
  const { api, isApiReady } = useApi();
  const bestNumber = useCall<BlockNumber>(isApiReady && api.derive.chain.bestNumber, []);

  return (
    <div className={className}>
      {label || ''}{withPound && '#'}{
        bestNumber
          ? formatNumber(bestNumber)
          : '-'
      }{children}
    </div>
  );
}

export default React.memo(BestNumber);
