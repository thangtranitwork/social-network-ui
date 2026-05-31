// components/Metadata.jsx
"use client";

import Head from "next/head";
import { useTranslations } from "next-intl";

export default function Metadata({
  title = "PocPoc",
  description,
  icon = "/pocpoc.png",
}) {
  const t = useTranslations('common');
  const metaDescription = description || t('metadata.description');
  
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
      <link rel="icon" href={icon} />
    </Head>
  );
}
