import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  // For tools/products
  productName?: string;
  productRating?: number;
  productReviewCount?: number;
  productCategory?: string;
  // For articles
  articleSection?: string;
  articleTags?: string[];
  // Disable indexing for private pages
  noIndex?: boolean;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'AI Feed - Discover, Compare & Share AI Tools',
  description = 'The ultimate AI tools platform. Discover 1000+ AI tools, compare features, read reviews, and connect with AI enthusiasts.',
  keywords = 'AI tools, artificial intelligence, machine learning, AI directory, AI comparison',
  image = 'https://aifeed.app/og-image.png',
  url = 'https://aifeed.app/',
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  productName,
  productRating,
  productReviewCount,
  productCategory,
  articleSection,
  articleTags,
  noIndex = false,
}) => {
  const fullTitle = title.includes('AI Feed') ? title : `${title} | AI Feed`;

  // Build JSON-LD based on type
  const getStructuredData = () => {
    const baseData: any[] = [];

    // Always include WebSite schema
    baseData.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AI Feed',
      url: 'https://aifeed.app/',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://aifeed.app/tools?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    });

    // Product/Tool schema
    if (type === 'product' && productName) {
      const productSchema: any = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: productName,
        description: description,
        url: url,
        applicationCategory: productCategory || 'BusinessApplication',
        operatingSystem: 'Web',
      };

      if (productRating && productReviewCount) {
        productSchema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: productRating.toString(),
          reviewCount: productReviewCount.toString(),
          bestRating: '5',
          worstRating: '1',
        };
      }

      if (image) {
        productSchema.image = image;
      }

      baseData.push(productSchema);
    }

    // Article schema
    if (type === 'article') {
      const articleSchema: any = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: description,
        url: url,
        image: image,
        publisher: {
          '@type': 'Organization',
          name: 'AI Feed',
          url: 'https://aifeed.app/',
        },
      };

      if (author) {
        articleSchema.author = {
          '@type': 'Person',
          name: author,
        };
      }

      if (publishedTime) {
        articleSchema.datePublished = publishedTime;
      }

      if (modifiedTime) {
        articleSchema.dateModified = modifiedTime;
      }

      if (articleSection) {
        articleSchema.articleSection = articleSection;
      }

      if (articleTags && articleTags.length > 0) {
        articleSchema.keywords = articleTags.join(', ');
      }

      baseData.push(articleSchema);
    }

    return baseData;
  };

  const structuredData = getStructuredData();

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {url && <link rel="canonical" href={url} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="AI Feed" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && articleSection && (
        <meta property="article:section" content={articleSection} />
      )}
      {type === 'article' && articleTags && articleTags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}

      {/* JSON-LD Structured Data */}
      {structuredData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
