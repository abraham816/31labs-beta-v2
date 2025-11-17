"use client";

import * as React from "@radix-ui/react-aspect-ratio@1.1.2";

function AspectRatio({
  ...props
}) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
