"use client";

import Image from "next/image";
import type { Adjunto } from "@/types/transaccion";

interface Props {
  adjunto: Adjunto;
}

export default function ReceiptThumbnail({ adjunto }: Props) {
  const isImage = adjunto.mimeType.startsWith("image/");

  if (isImage) {
    return (
      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
        <Image
          src={adjunto.dataUrl}
          alt={adjunto.nombreArchivo}
          width={80}
          height={80}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 flex-shrink-0">
      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
        {adjunto.nombreArchivo}
      </span>
    </div>
  );
}
