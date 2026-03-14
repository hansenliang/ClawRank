'use client';

import { TypeOnText } from './type-on-text';

type BrandHeadingProps = {
  text: string;
};

export default function BrandHeading({ text }: BrandHeadingProps) {
  return (
    <h1 className="brand-heading">
      <TypeOnText
        text={text}
        containerClassName="brand-heading-inner"
        textClassName="brand-heading-text"
        cursorClassName="brand-heading-cursor"
      />
    </h1>
  );
}
