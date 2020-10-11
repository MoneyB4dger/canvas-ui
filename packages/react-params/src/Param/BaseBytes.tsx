// Copyright 2017-2020 @canvas-ui/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Props as BaseProps, Size } from '../types';

import React, { useCallback, useState, useEffect } from 'react';
import { Compact } from '@polkadot/types';
import { Input } from '@canvas-ui/react-components';
import { hexToU8a, isHex, u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

import Bare from './Bare';

interface Props extends BaseProps {
  asHex?: boolean;
  children?: React.ReactNode;
  length?: number;
  size?: Size;
  validate?: (u8a: Uint8Array) => boolean;
  withLength?: boolean;
}

const defaultValidate = (): boolean =>
  true;

function convertInput (value: string): [boolean, Uint8Array] {
  // try hex conversion
  try {
    return [true, hexToU8a(value)];
  } catch (error) {
    // we continue...
  }

  // maybe it is an ss58?
  try {
    return [true, decodeAddress(value)];
  } catch (error) {
    // we continue
  }

  return [value === '0x', new Uint8Array([])];
}

function BaseBytes ({ asHex, children, className = '', defaultValue: { value }, isDisabled, isError, label, length = -1, onChange, onEnter, onEscape, size = 'full', validate = defaultValidate, withLabel, withLength }: Props): React.ReactElement<Props> {
  const [defaultValue] = useState(
    value
      ? isHex(value)
        ? value
        : u8aToHex(value as Uint8Array, isDisabled ? 256 : -1)
      : undefined
  );
  const [isValid, setIsValid] = useState(false);

  const _onChange = useCallback(
    (hex: string): void => {
      let [isValid, value] = convertInput(hex);

      isValid = isValid && validate(value) && (
        length !== -1
          ? value.length === length
          : value.length !== 0
      );

      if (withLength && isValid) {
        value = Compact.addLengthPrefix(value);
      }

      onChange && onChange({
        isValid,
        value: asHex
          ? u8aToHex(value)
          : value
      });

      setIsValid(isValid);
    },
    [asHex, length, onChange, validate, withLength]
  );

  useEffect((): void => {
    _onChange(defaultValue?.toString() || '');
  }, []);

  return (
    <Bare className={className}>
      <Input
        className={size}
        defaultValue={defaultValue as string}
        isAction={!!children}
        isDisabled={isDisabled}
        isError={isError || !isValid}
        label={label}
        onChange={_onChange}
        onEnter={onEnter}
        onEscape={onEscape}
        placeholder='0x...'
        type='text'
        withEllipsis
        withLabel={withLabel}
      >
        {children}
      </Input>
    </Bare>
  );
}

export default React.memo(BaseBytes);
