// Copyright 2017-2021 @canvas-ui/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

// TODO: We have a lot shared between this and InputExtrinsic & InputStorage

import { useApi } from '@canvas-ui/react-hooks';
import { DropdownOptions } from '@canvas-ui/react-util/types';
import React, { useCallback, useEffect, useState } from 'react';

import jsonrpc from '@polkadot/types/interfaces/jsonrpc';
import { DefinitionRpcExt } from '@polkadot/types/types';

import LinkedWrapper from '../InputExtrinsic/LinkedWrapper';
import methodOptions from './options/method';
import sectionOptions from './options/section';
import SelectMethod from './SelectMethod';
import SelectSection from './SelectSection';

interface Props {
  className?: string;
  defaultValue: DefinitionRpcExt;
  help?: React.ReactNode;
  isError?: boolean;
  label: React.ReactNode;
  onChange?: (value: DefinitionRpcExt) => void;
  withLabel?: boolean;
}

function InputRpc ({ className = '', defaultValue, help, label, onChange, withLabel }: Props): React.ReactElement<Props> {
  const { api } = useApi();
  const [optionsMethod, setOptionsMethod] = useState<DropdownOptions>(methodOptions(api, defaultValue.section));
  const [optionsSection] = useState<DropdownOptions>(sectionOptions(api));
  const [value, setValue] = useState<DefinitionRpcExt>((): DefinitionRpcExt => defaultValue);

  useEffect((): void => {
    onChange && onChange(value);
  }, [onChange, value]);

  const _onMethodChange = useCallback(
    (newValue: DefinitionRpcExt): void => {
      if (value.section === newValue.section && value.method === newValue.method) {
        return;
      }

      // set via callback since the method is a function itself
      setValue((): DefinitionRpcExt => newValue);
    },
    [value]
  );

  const _onSectionChange = useCallback(
    (section: string): void => {
      if (section === value.section) {
        return;
      }

      const optionsMethod = methodOptions(api, section);

      setOptionsMethod(optionsMethod);
      _onMethodChange(jsonrpc[section][optionsMethod[0].value]);
    },
    [_onMethodChange, api, value]
  );

  return (
    <LinkedWrapper
      className={className}
      help={help}
      label={label}
      withLabel={withLabel}
    >
      <SelectSection
        className='small'
        onChange={_onSectionChange}
        options={optionsSection}
        value={value}
      />
      <SelectMethod
        className='large'
        onChange={_onMethodChange}
        options={optionsMethod}
        value={value}
      />
    </LinkedWrapper>
  );
}

export default React.memo(InputRpc);
