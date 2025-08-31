import {
  ComponentPropsWithoutRef,
  ElementType,
  PropsWithChildren,
  ReactElement,
  forwardRef,
} from 'react';

import { cn } from '@/lib/utils';

type PolymorphicElementProps<T extends ElementType> =
  ComponentPropsWithoutRef<T> & {
    as?: T;
  };

const PolymorphicElement = forwardRef(
  <T extends ElementType>(
    {
      as,
      children,
      className,
      ...rest
    }: PropsWithChildren<PolymorphicElementProps<T>>,
    ref: React.ComponentPropsWithRef<T>['ref'],
  ): ReactElement => {
    const Element = as || 'div';

    return (
      <Element ref={ref} className={cn('', className)} {...rest}>
        {children}
      </Element>
    );
  },
);

PolymorphicElement.displayName = 'PolymorphicElement';

export default PolymorphicElement;
