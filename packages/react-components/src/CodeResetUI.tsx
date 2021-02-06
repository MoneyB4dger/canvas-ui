// Copyright 2017-2020 @canvas-ui/app-execute authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BareProps } from './types';

import React from 'react';

import Button from './Button';
import Modal from './Modal';
import { useTranslation } from './translate';
import keyring from "@polkadot/ui-keyring";

interface Props extends BareProps {
  closeModal: () => void
}

function CodeResetUI ({ closeModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const purgeData = () => {
    const existingContractList = keyring.getContracts()
    console.log(existingContractList)
    existingContractList.forEach(existingContract => {
      console.log(existingContract.address.toString())
      keyring.forgetContract(existingContract.address.toString());
    })
    closeModal()
  }

  return (
    <Modal
      onClose={closeModal}
    >
      <Modal.Header>{t<string>('Node out of sync')}</Modal.Header>
      <Modal.Content>
        {t<string>('It seems your currently running chain and the UI artifacts are out of sync.')}
        <br/>
        <br/>
        {t<string>('This can happen after purging a chain or switching the chain to another.')}
        {t<string>('If this is the case please click [OK] in order to reset your UI.')}
      </Modal.Content>
      <Modal.Actions onCancel={closeModal}>
        <Button
          isPrimary
          label={t<string>('OK')}
          onClick={purgeData}
        />
      </Modal.Actions>
    </Modal>
  );
}

export default React.memo(CodeResetUI);
