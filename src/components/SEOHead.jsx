import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEOHead Component
 * Injects per-page <title> and <meta> tags for SEO.
 */
const SEOHead = ({ title, description, keywords }) => {
  const siteName = 'Multi-Tools Suite';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
    </Helmet>
  );
};

export default SEOHead;
