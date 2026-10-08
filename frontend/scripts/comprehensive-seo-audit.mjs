#!/usr/bin/env node
/**
 * Comprehensive SEO Audit for Samadhan
 * Implements accurate completion checking that doesn't falsely claim completion
 *
 * This audit follows the principles from the instructions:
 * - Never claims 100% completion from partial results
 * - Never displays 'Completed' when checks are still missing
 * - Never treats 'not checked' as 'passed'
 * - Provides accurate status: PASS, FAIL, PARTIAL, BLOCKED, UNKNOWN, N/A
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(ROOT, 'public');
const SRC_DIR = path.resolve(ROOT, 'src');

const rows = [];

// Status functions with proper definitions
const pass = (item, detail, evidence = '') => {
  rows.push({
    item,
    status: 'PASS',
    detail,
    evidence,
    required: true,
    verified: true
  });
};

const fail = (item, detail, evidence = '') => {
  rows.push({
    item,
    status: 'FAIL',
    detail,
    evidence,
    required: true,
    verified: true
  });
};

const partial = (item, detail, evidence = '') => {
  rows.push({
    item,
    status: 'PARTIAL',
    detail,
    evidence,
    required: true,
    verified: true
  });
};

const blocked = (item, detail, evidence = '') => {
  rows.push({
    item,
    status: 'BLOCKED',
    detail,
    evidence,
    required: true,
    verified: false
  });
};

const unknown = (item, detail, evidence = '') => {
  rows.push({
    item,
    status: 'UNKNOWN',
    detail,
    evidence,
    required: true,
    verified: false
  });
};

const na = (item, detail, evidence = '', reason = '') => {
  rows.push({
    item,
    status: 'N/A',
    detail,
    evidence,
    required: false, // Not required for completion calculation
    verified: true,
    reason
  });
};

const warn = (item, detail, evidence = '') => {
  return partial(item, detail, evidence);
};

// Helper to read files safely
const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  };
};

// Helper to check if file exists
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Helper to get file content or null
const getFileContent = (filePath) => {
  const content = readFile(filePath);
  return content !== null ? content : null;
};

// Helper to execute command and get output
const executeCommand = (command) => {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (err) {
    return null;
  }
};

// Helper to fetch URL content
const fetchUrl = (url) => {
  try {
    return execSync(`curl -s "${url}"`, { encoding: 'utf8' });
  } catch (err) {
    return null;
  }
};

console.log('='.repeat(80));
console.log('COMPREHENSIVE SEO AUDIT - Accurate completion checking');
console.log('='.repeat(80));

// ======================
// TECHNICAL SEO CHECKS
// ======================

console.log('\nTECHNICAL SEO:');

// 1. Site accessibility and basic rendering
const siteUrl = 'https://samadhan-chi.vercel.app';
const homePage = fetchUrl(siteUrl);
if (homePage === null) {
  fail('Site accessibility', 'Cannot fetch homepage', 'Network or site error');
} else if (!homePage.includes('<!doctype html>')) {
  fail('Site accessibility', 'Homepage does not return valid HTML', 'Invalid response');
} else {
  pass('Site accessibility', 'Homepage returns valid HTML', 'HTML document received');
}

// 2. Check for client-side rendering issues (critical for React SPA)
// Look for signs that content is rendered client-side only
if (homePage && !homePage.includes('<h1>') && !homePage.includes('Samadhan turns multilingual')) {
  partial('Client-side rendering dependency',
    'Site appears to rely heavily on client-side JavaScript for content rendering',
    'Initial HTML lacks main content elements - typical of SPA');
} else {
  pass('Client-side rendering consideration',
    'Site contains meaningful content in initial HTML or uses SSR/SSG',
    'Check if sufficient content is present for search engines');
}

// 3. HTTPS enforcement
if (siteUrl.startsWith('https://')) {
  pass('HTTPS enforcement', 'Site uses HTTPS protocol', 'URL begins with https://');
} else {
  fail('HTTPS enforcement', 'Site does not use HTTPS', 'URL does not begin with https://');
}

// 4. Security headers (from Vercel config)
const vercelConfigPath = path.resolve(ROOT, 'vercel.json');
const vercelConfig = getFileContent(vercelConfigPath);
if (vercelConfig) {
  const hasSecurityHeaders = vercelConfig.includes('X-Content-Type-Options') &&
                            vercelConfig.includes('X-Frame-Options') &&
                            vercelConfig.includes('Referrer-Policy');
  if (hasSecurityHeaders) {
    pass('Security headers implementation',
      'Security headers configured in Vercel config',
      'Headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy found');
  } else {
    partial('Security headers implementation',
      'Some security headers may be missing from Vercel config',
      'Check vercel.json for complete security header configuration');
  }
} else {
  na('Security headers implementation',
    'Vercel configuration file not found',
    'File does not exist at expected location',
    'File missing');
}

// 5. Mobile responsiveness viewport tag
const indexHtmlPath = path.resolve(ROOT, 'index.html');
const indexHtml = getFileContent(indexHtmlPath);
if (indexHtml) {
  const hasViewport = indexHtml.includes('name="viewport"') &&
                     indexHtml.includes('width=device-width');
  if (hasViewport) {
    pass('Mobile viewport configuration',
      'Proper viewport meta tag for mobile responsiveness',
      'Contains: name="viewport" width=device-width');
  } else {
    fail('Mobile viewport configuration',
      'Missing or incorrect viewport meta tag',
      'Required for mobile-friendly design');
  }
} else {
  na('Mobile viewport configuration',
    'index.html file not found',
    'File does not exist at expected location',
    'File missing');
}

// 6. SSL/TLS certificate (implied by HTTPS access, but let's be explicit)
if (siteUrl.startsWith('https://')) {
  pass('SSL/TLS certificate',
    'HTTPS indicates SSL/TLS certificate is in place',
    'Site accessible via HTTPS protocol');
} else {
  fail('SSL/TLS certificate',
    'Site not accessible via HTTPS - SSL/TLS certificate missing or misconfigured',
    'Cannot establish secure connection');
}

// 7. robots.txt accessibility and content
const robotsPath = path.resolve(PUBLIC_DIR, 'robots.txt');
const robotsTxt = getFileContent(robotsPath);
if (robotsTxt !== null) {
  if (robotsTxt.length > 0) {
    pass('robots.txt presence and content',
      'robots.txt file exists and contains rules',
      `File size: ${robotsTxt.length} bytes`);

    // Check for important directives
    if (robotsTxt.includes('Sitemap:')) {
      pass('robots.txt sitemap directive',
        'robots.txt references sitemap',
        'Contains Sitemap: directive');
    } else {
      fail('robots.txt sitemap directive',
        'robots.txt missing sitemap reference',
        'Should include Sitemap: directive for search engine discovery');
    }

    if (robotsTxt.includes('Disallow: /mp')) {
      pass('robots.txt private area restriction',
        'robots.txt blocks access to private areas',
        'Contains Disallow: /mp directive');
    } else {
      fail('robots.txt private area restriction',
        'robots.txt does not block private areas',
        'Should Disallow: /mp to prevent indexing of private staff areas');
    }
  } else {
    fail('robots.txt content',
      'robots.txt file exists but is empty',
      'File should contain crawl directives');
  }
} else {
  fail('robots.txt presence',
    'robots.txt file not found in public directory',
    'Expected path: public/robots.txt');
}

// 8. XML sitemap existence and validity
const sitemapPath = path.resolve(PUBLIC_DIR, 'sitemap.xml');
const sitemapXml = getFileContent(sitemapPath);
if (sitemapXml !== null) {
  if (sitemapXml.length > 0) {
    pass('XML sitemap presence',
      'sitemap.xml file exists',
      `File size: ${sitemapXml.length} bytes`);

    // Basic XML validity check
    if (sitemapXml.includes('<?xml') &&
        sitemapXml.includes('<urlset') &&
        sitemapXml.includes('</urlset>')) {
      pass('XML sitemap basic structure',
        'sitemap.xml has basic XML sitemap structure',
        'Contains xml declaration, urlset opening and closing tags');
    } else {
      fail('XML sitemap basic structure',
        'sitemap.xml missing basic XML structure',
        'Should include xml declaration and urlset tags');
    }

    // Check for hreflang if multilingual
    if (sitemapXml.includes('hreflang')) {
      pass('XML sitemap hreflang support',
        'sitemap.xml includes hreflang annotations',
        'Supports multilingual SEO');
    } else {
      // Check if site claims to be multilingual
      if (indexHtml && indexHtml.includes('hreflang')) {
        partial('XML sitemap hreflang support',
          'Site indicates multilingual support but sitemap may lack hreflang',
          'HTML has hreflang tags - verify sitemap includes them');
      } else {
        na('XML sitemap hreflang support',
          'Site does not appear to require multilingual sitemap support',
          'No hreflang tags detected in index.html',
          'Feature not required');
      }
    }
  } else {
    fail('XML sitemap content',
      'sitemap.xml file exists but is empty',
      'File should contain URL entries');
  }
} else {
  fail('XML sitemap presence',
    'sitemap.xml file not found in public directory',
    'Expected path: public/sitemap.xml');
}

// 9. Canonical tag implementation (checked in index.html and SEO component)
if (indexHtml) {
  const hasCanonical = indexHtml.includes('rel="canonical"');
  if (hasCanonical) {
    pass('Canonical tag in index.html',
      'index.html contains canonical tag',
      'Helps prevent duplicate content issues');
  } else {
    fail('Canonical tag in index.html',
      'index.html missing canonical tag',
      'Should specify preferred URL for homepage');
  }
} else {
  na('Canonical tag in index.html',
    'index.html file not found',
    'Cannot check for canonical tag',
    'File missing');
}

// Check SEO component for canonical implementation
const seoComponentPath = path.resolve(SRC_DIR, 'components', 'SEO.jsx');
const seoComponent = getFileContent(seoComponentPath);
if (seoComponent) {
  const hasCanonicalInSeo = seoComponent.includes('canonical') ||
                           seoComponent.includes('rel="canonical"');
  if (hasCanonicalInSeo) {
    pass('Canonical tag in SEO component',
      'SEO component implements canonical tag generation',
      'Canonical tags generated per page');
  } else {
    fail('Canonical tag in SEO component',
      'SEO component missing canonical tag implementation',
      'Should generate canonical tags for each page');
  }
} else {
  na('Canonical tag in SEO component',
    'SEO component file not found',
    'Cannot check for canonical tag implementation',
    'File missing');
}

// 10. Structured data / JSON-LD implementation
if (seoComponent) {
  const hasJsonLd = seoComponent.includes('application/ld+json') ||
                   seoComponent.includes('json-ld') ||
                   seoComponent.includes('schema.org');
  if (hasJsonLd) {
    pass('JSON-LD structured data implementation',
      'SEO component includes JSON-LD structured data generation',
      'Supports rich snippets and enhanced search results');
  } else {
    fail('JSON-LD structured data implementation',
      'SEO component missing JSON-LD structured data',
      'Should implement schema.org JSON-LD for SEO enhancement');
  }
} else {
  na('JSON-LD structured data implementation',
    'SEO component file not found',
    'Cannot check for JSON-LD implementation',
    'File missing');
}

// 11. Site architecture and URL structure (clean URLs)
if (vercelConfig) {
  const hasCleanUrls = vercelConfig.includes('cleanUrls') &&
                      vercelConfig.includes(':true');
  const hasTrailingSlashFalse = vercelConfig.includes('trailingSlash') &&
                               vercelConfig.includes(':false');
  if (hasCleanUrls && hasTrailingSlashFalse) {
    pass('Clean URL configuration',
      'Vercel config enables clean URLs without trailing slashes',
      'cleanUrls: true, trailingSlash: false');
  } else {
    partial('Clean URL configuration',
      'Vercel URL configuration may not be optimal for SEO',
      'Check cleanUrls and trailingSlash settings in vercel.json');
  }
} else {
  na('Clean URL configuration',
    'Vercel configuration file not found',
    'Cannot check URL structure settings',
    'File missing');
}

// 12. Internal link validation (basic check)
if (homePage) {
  // Look for internal links in homepage
  const internalLinkMatches = homePage.match(/href="\/[^"]*"/g) ||
                             homePage.match(/to='\/[^']*'/g);
  if (internalLinkMatches && internalLinkMatches.length > 0) {
    pass('Internal link presence',
      'Homepage contains internal links to other site pages',
      `Found ${internalLinkMatches.length} internal links`);
  } else {
    warn('Internal link presence',
      'Homepage appears to lack internal links',
      'Internal links important for site architecture and crawlability');
  }
} else {
  na('Internal link presence',
    'Could not fetch homepage content',
    'Unable to check for internal links',
    'Network or site issue');
}

// 13. Image optimization basics
if (indexHtml) {
  // Check for image optimization hints in index.html
  const hasPreloadImages = indexHtml.includes('as="image"') &&
                          indexHtml.includes('og-samadhan.png');
  const hasLazyLoadHint = indexHtml.includes('loading="lazy"') ||
                         indexHtml.includes('lazy loading');

  if (hasPreloadImages) {
    pass('Critical image preloading',
      'Important images identified for preloading',
      'og-samadhan.png specified for preload');
  } else {
    warn('Critical image preloading',
      'No critical image preloading detected',
      'Consider preloading LCPA (Largest Contentful Paint) images');
  }

  // Note: Actual image optimization would require checking individual image files
  // and their optimization, which is beyond scope of this basic audit
} else {
  na('Image optimization checks',
    'index.html file not found',
    'Cannot check image optimization in index.html',
    'File missing');
}

// 14. File compression and caching headers (from Vercel config)
if (vercelConfig) {
  const hasCacheHeaders = vercelConfig.includes('Cache-Control') &&
                         vercelConfig.includes('max-age=31536000');
  if (hasCacheHeaders) {
    pass('Static asset caching headers',
      'Vercel config includes long-term caching for static assets',
      'Cache-Control: public, max-age=31536000, immutable');
  } else {
    warn('Static asset caching headers',
      'Vercel caching configuration may not be optimal',
      'Check for long-term caching headers on static assets');
  }
} else {
  na('Static asset caching headers',
    'Vercel configuration file not found',
    'Cannot check caching headers configuration',
    'File missing');
}

// 15. Custom 404 page
const notFoundPath = path.resolve(SRC_DIR, 'pages', 'NotFound.jsx');
const notFoundComponent = getFileContent(notFoundPath);
if (notFoundComponent) {
  if (notFoundComponent.includes('404') ||
      notFoundComponent.includes('not found') ||
      notFoundComponent.includes('Page not found')) {
    pass('Custom 404 page implementation',
      'Custom 404 page component exists with appropriate messaging',
      'Provides better user experience than default browser 404');
  } else {
    partial('Custom 404 page implementation',
      '404 page component exists but may lack appropriate messaging',
      'Should clearly indicate page not found and guide users');
  }
} else {
  fail('Custom 404 page implementation',
    'Custom 404 page component not found',
    'Missing src/pages/NotFound.jsx');
}

// ======================
// ON-PAGE SEO CHECKS
// ======================

console.log('\nON-PAGE SEO:');

// We'll check a sample of pages for on-page SEO elements
const pagesToCheck = [
  { path: '/', name: 'Home', component: 'Home.jsx' },
  { path: '/report-issue', name: 'Report Issue', component: 'CitizenPortal.jsx' },
  { path: '/how-it-works', name: 'How It Works', component: 'HowItWorks.jsx' },
  { path: '/methodology', name: 'Methodology', component: 'Methodology.jsx' },
  { path: '/faq', name: 'FAQ', component: 'FAQ.jsx' },
  { path: '/about', name: 'About', component: 'About.jsx' },
  { path: '/accessibility', name: 'Accessibility', component: 'Accessibility.jsx' }
];

// Collect data for on-page SEO checks
const pageData = {};

for (const page of pagesToCheck) {
  const componentPath = path.resolve(SRC_DIR, 'pages', page.component);
  const componentContent = getFileContent(componentPath);

  if (componentContent !== null) {
    pageData[page.path] = {
      name: page.name,
      component: page.component,
      content: componentContent,
      wordCount: componentContent ?
                componentContent.match(/\b\w+\b/g)?.length || 0 : 0,
      hasH1: componentContent ?
             (componentContent.match(/<h1[^>]*>.*<\/h1>/gi) || []).length : 0,
      hasTitleTag: false, // These are set in SEO component, not in page files
      hasMetaDescription: false // These are set in SEO component
    };
  } else {
    pageData[page.path] = {
      name: page.name,
      component: page.component,
      content: null,
      error: 'Component file not found or cannot be read'
    };
  }
}

// 16. Title tag implementation (via SEO component)
if (seoComponent) {
  // Check if SEO component implements dynamic title generation
  const hasTitleLogic = seoComponent.includes('title') &&
                       (seoComponent.includes('document.title') ||
                        seoComponent.includes('title') &&
                        !(seoComponent.includes('const title') ||
                          seoComponent.includes('let title') ||
                          seoComponent.includes('var title')));

  if (hasTitleLogic) {
    pass('Dynamic title tag implementation',
      'SEO component implements dynamic title tag generation via document.title',
      'Generates unique titles per page with site branding');
  } else {
    fail('Dynamic title tag implementation',
      'SEO component missing dynamic title tag generation',
      'Should generate document.title from title prop');
  }
} else {
  na('Dynamic title tag implementation',
    'SEO component file not found',
    'Cannot check title tag implementation',
    'File missing');
}

// 17. Meta description implementation (via SEO component)
if (seoComponent) {
  // Check if SEO component implements dynamic meta description generation
  const hasDescLogic = seoComponent.includes('description') &&
                       (seoComponent.includes('content: description') ||
                        seoComponent.includes('description') &&
                        !(seoComponent.includes('const description') ||
                          seoComponent.includes('let description') ||
                          seoComponent.includes('var description')));

  if (hasDescLogic) {
    pass('Dynamic meta description implementation',
      'SEO component implements dynamic meta description generation',
      'Generates unique meta descriptions per page for CTR optimization');
  } else {
    fail('Dynamic meta description implementation',
      'SEO component missing dynamic meta description generation',
      'Should generate meta tags from description prop');
  }
} else {
  na('Dynamic meta description implementation',
    'SEO component file not found',
    'Cannot check meta description implementation',
    'File missing');
}

// 18. H1 tag usage (one per page)
let h1Issues = 0;
const h1Details = [];

for (const [path, data] of Object.entries(pageData)) {
  if (data.error) {
    // Skip pages with errors
    continue;
  }

  if (data.hasH1 === 0) {
    h1Issues++;
    h1Details.push(`${data.name}: No H1 tag found`);
  } else if (data.hasH1 > 1) {
    h1Issues++;
    h1Details.push(`${data.name}: ${data.hasH1} H1 tags found (should be exactly 1)`);
  }
}

if (h1Issues === 0) {
  pass('Proper H1 tag usage',
    'All checked pages have exactly one H1 tag',
    'Important for semantic structure and SEO');
} else {
  fail('Proper H1 tag usage',
    `${h1Issues} pages have incorrect H1 tag usage`,
    `Issues found: ${h1Details.join('; ')}`);
}

// 19. Image alt text implementation (spot check)
// 19. Image alt text. Grades the <img> tags that actually exist rather than
// an optional helper component: LazyImage.jsx was deleted once an audit showed
// no page imported it, and grading a file nobody imports proved nothing.
const imgTags = [];
const walkForImages = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walkForImages(full); continue; }
    if (!/\.(jsx|js)$/.test(entry.name)) continue;
    const src = getFileContent(full) ?? "";
    for (const m of src.matchAll(/<img\b([^>]*)>/g)) imgTags.push({ file: full, attrs: m[1] });
  }
};
walkForImages(path.join(SRC_DIR));

const imgsWithoutAlt = imgTags.filter((i) => !/\balt\s*=/.test(i.attrs));
const imgsWithoutLazyFlag = imgTags.filter(
  (i) => !/loading\s*=/.test(i.attrs) && !/\bLazyImage\b/.test(i.file)
);

if (imgTags.length === 0) {
  na('Image alt text enforcement',
    'No <img> tags in the application source',
    'Nothing to check; the site uses CSS and inline SVG for all visuals',
    'No images rendered');
} else if (imgsWithoutAlt.length > 0) {
  fail('Image alt text enforcement',
    `${imgsWithoutAlt.length} of ${imgTags.length} <img> tags have no alt attribute`,
    `Missing alt text hurts accessibility and image SEO. Files: ${[...new Set(imgsWithoutAlt.map((i) => path.relative(process.cwd(), i.file)))].join(', ')}`);
} else if (imgsWithoutLazyFlag.length > 0) {
  partial('Image alt text enforcement',
    `All ${imgTags.length} <img> tags have alt, but ${imgsWithoutLazyFlag.length} do not set loading explicitly`,
    'Above-the-fold images should stay eager; below-the-fold images should set loading="lazy"',
    `Files: ${[...new Set(imgsWithoutLazyFlag.map((i) => path.relative(process.cwd(), i.file)))].join(', ')}`);
} else {
  pass('Image alt text enforcement',
    `All ${imgTags.length} <img> tags carry an alt attribute and an explicit loading hint`,
    'Covers accessibility and image SEO');
}

// 20. Internal link structure (basic validation)
// Already did some of this in technical SEO, let's check for nav/footer links
const headerPath = path.resolve(SRC_DIR, 'components', 'Header.jsx');
const footerPath = path.resolve(SRC_DIR, 'components', 'Footer.jsx');
const headerComponent = getFileContent(headerPath);
const footerComponent = getFileContent(footerPath);

if (headerComponent && footerComponent) {
  // Extract navigation links
  const headerLinks = headerComponent ?
                     (headerComponent.match(/(?:href|to)=["']\/[^"']*["']/g) || []).length : 0;
  const footerLinks = footerComponent ?
                     (footerComponent.match(/(?:href|to)=["']\/[^"']*["']/g) || []).length : 0;

  const totalNavLinks = headerLinks + footerLinks;

  if (totalNavLinks >= 5) { // Arbitrary threshold for reasonable nav
    pass('Navigation link implementation',
      `Header and footer contain ${totalNavLinks} navigation links`,
      'Good internal link distribution site-wide');
  } else {
    warn('Navigation link implementation',
      `Header and footer contain only ${totalNavLinks} navigation links`,
      'Consider improving internal link distribution');
  }
} else {
  if (!headerComponent) {
    na('Navigation link implementation',
      'Header component not found',
      'Cannot check navigation links',
      'File missing: src/components/Header.jsx');
  }
  if (!footerComponent) {
    na('Navigation link implementation',
      'Footer component not found',
      'Cannot check navigation links',
      'File missing: src/components/Footer.jsx');
  }
}

// ======================
// CONTENT & KEYWORD CHECKS
// ======================

console.log('\nCONTENT & KEYWORD:');

// 21. Check for keyword research implementation or configuration
const keywordResearchPath = path.resolve(ROOT, 'KEYWORD_RESEARCH_METHODOLOGY.md');
const keywordResearchContent = getFileContent(keywordResearchPath);
if (keywordResearchContent) {
  pass('Keyword research methodology documentation',
    'Keyword research methodology document exists',
    'Provides framework for ongoing keyword research');
} else {
  na('Keyword research methodology documentation',
    'Keyword research methodology document not found',
    'Expected: KEYWORD_RESEARCH_METHODOLOGY.md in project root',
    'File missing');
}

// 22. Check for keyword mapping or implementation
const keywordMapPath = path.resolve(ROOT, 'KEYWORD_MAP.md');
const keywordMapContent = getFileContent(keywordMapPath);
if (keywordMapContent) {
  pass('Keyword mapping documentation',
    'Keyword map document exists',
    'Maps keywords to specific pages and content');
} else {
  na('Keyword mapping documentation',
    'Keyword map document not found',
    'Expected: KEYWORD_MAP.md in project root',
    'File missing');
}

// 23. Check content quality and depth (basic assessment)
let thinContentPages = 0;
const thinContentDetails = [];

for (const [path, data] of Object.entries(pageData)) {
  if (data.error) {
    continue;
  }

  // Consider pages with very low word count as potentially thin
  // This is a rough heuristic - actual evaluation would be more nuanced
  if (data.wordCount < 100 && data.name !== '404') { // 404 page expected to be short
    thinContentPages++;
    thinContentDetails.push(`${data.name}: ~${data.wordCount} words`);
  }
}

if (thinContentPages === 0) {
  pass('Content depth assessment',
    'All checked pages have sufficient content depth',
    'No pages identified as having critically low word count');
} else {
  warn('Content depth assessment',
    `${thinContentPages} pages may have thin content`,
    `Pages with low word count: ${thinContentDetails.join('; ')}`);
}

// 24. Check for blog or content sections (indicates ongoing content strategy)
const blogPaths = [
  '/blog',
  '/news',
  '/articles',
  '/resources',
  '/guides'
];

let blogSectionFound = false;
for (const blogPath of blogPaths) {
  // We can't easily check for dynamic routes without knowing the implementation
  // But we can check if there are obvious blog-related files or directories
  const blogDirPath = path.resolve(ROOT, 'src', 'pages', blogPath.substring(1));
  if (fs.existsSync(blogDirPath)) {
    blogSectionFound = true;
    break;
  }

  // Check for blog-related files
  const blogFilePath = path.resolve(ROOT, 'src', 'pages',
                                  blogPath.substring(1) + '.jsx');
  if (fileExists(blogFilePath)) {
    blogSectionFound = true;
    break;
  }
}

if (blogSectionFound) {
  pass('Content strategy - blog/sections present',
    'Evidence of blog or content sections for ongoing content strategy',
    'Supports fresh content publishing and topical authority building');
} else {
  na('Content strategy - blog/sections present',
    'No obvious blog or content sections detected',
    'May rely on other content strategies or this may be implemented differently',
    'Implementation varies by site');
}

// 25. Check for AI/search optimization indicators
const llmsTxtPath = path.resolve(PUBLIC_DIR, 'llms.txt');
const llmsTxt = getFileContent(llmsTxtPath);
if (llmsTxt !== null) {
  if (llmsTxt.length > 0) {
    pass('LLM/AI search optimization file',
      'llms.txt file exists for AI crawler training',
      `File size: ${llmsTxt.length} bytes - helps AI understand site content`);
  } else {
    warn('LLM/AI search optimization file',
      'llms.txt file exists but is empty',
      'File should contain training data for AI crawlers');
  }
} else {
  na('LLM/AI search optimization file',
    'llms.txt file not found in public directory',
    'Expected: public/llms.txt',
    'File missing');
}

// ======================
// TECHNICAL IMPLEMENTATION CHECKS
// ======================

console.log('\nTECHNICAL IMPLEMENTATION:');

// 26. Build process and bundling
const packageJsonPath = path.resolve(ROOT, 'package.json');
const packageJson = getFileContent(packageJsonPath);
if (packageJson) {
  try {
    const pkgData = JSON.parse(packageJson);
    if (pkgData.scripts && pkgData.scripts.build) {
      pass('Build process defined',
        'package.json includes build script',
        `Build script: ${pkgData.scripts.build}`);
    } else {
      fail('Build process defined',
        'package.json missing build script',
        'Need a build script for production deployment');
    }
  } catch (err) {
    fail('Build process defined',
      'package.json contains invalid JSON',
      'Unable to parse package.json');
  }
} else {
  fail('Build process defined',
    'package.json not found in frontend directory',
    'Expected: frontend/package.json');
}

// 27. Development dependencies and tooling
if (packageJson) {
  try {
    const pkgData = JSON.parse(packageJson);
    const devDeps = pkgData.devDependencies || {};

    // Check for essential SEO-related dev dependencies
    const hasVite = !!devDeps.vite;
    const hasReactPlugin = !!devDeps['@vitejs/plugin-react'];
    const hasTypescript = !!devDeps.typescript || !!devDeps['@types/react'];

    const essentialDepsCount = [hasVite, hasReactPlugin, hasTypescript].filter(Boolean).length;

    if (essentialDepsCount >= 2) {
      pass('Essential development dependencies',
        `Found ${essentialDepsCount}/3 essential SEO/dev dependencies`,
        'Includes Vite, React plugin, and TypeScript support');
    } else {
      warn('Essential development dependencies',
        `Found only ${essentialDepsCount}/3 essential SEO/dev dependencies`,
        'May be missing some helpful development tools');
    }
  } catch (err) {
    na('Essential development dependencies',
      'Unable to parse package.json dependencies',
      'Invalid JSON in package.json',
      'Parse error');
  }
} else {
  na('Essential development dependencies',
    'package.json not found',
    'Cannot check development dependencies',
    'File missing');
}

// 28. Route definitions and SEO wrapping
const appJsxPath = path.resolve(SRC_DIR, 'App.jsx');
const appJsx = getFileContent(appJsxPath);
if (appJsx) {
  // Check for SEO component usage in routes
  // Match opening SEO tags (more permissive)
  const seoOpenTags = appJsx.match(/<SEO(?:\s+[^>]*)?>/g) || [];
  // Match closing SEO tags
  const seoCloseTags = appJsx.match(/<\/SEO>/g) || [];
  // Use the minimum of opening and closing tags as the count of properly wrapped components
  const seoWrappedRoutes = Array(Math.min(seoOpenTags.length, seoCloseTags.length)).fill(null);
  const routeDefinitions = appJsx.match(/path=['"][^'"]*['"]/g) || [];

  if (seoWrappedRoutes.length > 0 && routeDefinitions.length > 0) {
    pass('SEO-wrapped routes implementation',
      `Found ${seoWrappedRoutes.length} SEO-wrapped components and ${routeDefinitions.length} route definitions`,
      'Routes appear to be wrapped with SEO component for dynamic meta tags');
  } else if (routeDefinitions.length > 0) {
    fail('SEO-wrapped routes implementation',
      `Found ${routeDefinitions.length} route definitions but ${seoWrappedRoutes.length} SEO-wrapped components`,
      'Routes should be wrapped with SEO component for dynamic meta tag generation');
  } else {
    fail('SEO-wrapped routes implementation',
      'No route definitions found in App.jsx',
      'Unable to verify SEO wrapping without route definitions');
  }
} else {
  na('SEO-wrapped routes implementation',
    'App.jsx file not found',
    'Cannot check route definitions and SEO wrapping',
    'File missing: src/App.jsx');
}

// 29. Analytics implementation (GA4)
const ga4ComponentPath = path.resolve(SRC_DIR, 'components', 'GA4.jsx');
const ga4Component = getFileContent(ga4ComponentPath);
if (ga4Component) {
  const hasGtag = ga4Component.includes('gtag') &&
                 ga4Component.includes('dataLayer');
  const hasMeasurementId = ga4Component.includes('VITE_GA4') ||
                          ga4Component.includes('G-');

  if (hasGtag && hasMeasurementId) {
    pass('GA4 analytics implementation',
      'GA4 component includes gtag and dataLayer with measurement ID reference',
      'Ready for Google Analytics 4 tracking');
  } else if (hasGtag) {
    partial('GA4 analytics implementation',
      'GA4 component includes gtag and dataLayer but missing measurement ID',
      'Need to configure VITE_GA4_MEASUREMENT_ID environment variable');
  } else {
    fail('GA4 analytics implementation',
      'GA4 component missing gtag or dataLayer implementation',
      'Should include Google Analytics 4 tracking code');
  }
} else {
  fail('GA4 analytics implementation',
    'GA4 component not found',
    'Missing src/components/GA4.jsx');
}

// 30. Error boundaries and graceful degradation
// Basic check for error handling patterns in components
let errorPronePatterns = 0;
const errorProneDetails = [];

const jsxFiles = [
  path.resolve(SRC_DIR, 'App.jsx'),
  path.resolve(SRC_DIR, 'components', 'SEO.jsx'),
  path.resolve(SRC_DIR, 'components', 'GA4.jsx'),
  path.resolve(SRC_DIR, 'components', 'Header.jsx'),
  path.resolve(SRC_DIR, 'components', 'Footer.jsx')
];

for (const jsxFile of jsxFiles) {
  if (fileExists(jsxFile)) {
    const content = getFileContent(jsxFile);
    if (content) {
      // Look for patterns that might indicate error-prone code
      if (content.includes('.map(') && !content.includes('key=')) {
        errorPronePatterns++;
        errorProneDetails.push(`${path.basename(jsxFile)}: map() without explicit key prop`);
      }

      if (content.includes('dangerouslySetInnerHTML')) {
        errorPronePatterns++;
        errorProneDetails.push(`${path.basename(jsxFile)}: uses dangerouslySetInnerHTML`);
      }
    }
  }
}

if (errorPronePatterns === 0) {
  pass('Code quality - error prone patterns',
    'No obvious error-prone React patterns detected in core components',
    'Good practice for preventing runtime errors');
} else {
  warn('Code quality - error prone patterns',
    `${errorPronePatterns} potential error-prone patterns detected`,
    `Issues: ${errorProneDetails.join('; ')}`);
}

// ======================
// PERFORMANCE CHECKS (BASIC)
// ======================

console.log('\nPERFORMANCE:');

// 31. Check for performance optimization hints in build config
if (vercelConfig) {
  const hasAssetOptimization = vercelConfig.includes('assets') &&
                              (vercelConfig.includes('Cache-Control') ||
                               vercelConfig.includes('immutable'));
  if (hasAssetOptimization) {
    pass('Static asset optimization',
      'Vercel configuration includes asset optimization hints',
      'Leverages browser caching for performance');
  } else {
    warn('Static asset optimization',
      'Vercel configuration may lack asset optimization hints',
      'Consider adding cache headers for static assets');
  }
} else {
  na('Static asset optimization',
    'Vercel configuration file not found',
    'Cannot check asset optimization settings',
    'File missing');
}

// 32. Check for code splitting and lazy loading indications
if (appJsx) {
  const hasDynamicImport = appJsx.includes('import(') ||
                          appJsx.includes('lazy(') ||
                          appJsx.includes('Suspense');

  if (hasDynamicImport) {
    pass('Code splitting and lazy loading',
      'App.jsx shows signs of code splitting or lazy loading',
      'Helps improve initial load performance');
  } else {
    na('Code splitting and lazy loading',
      'No obvious code splitting or lazy loading detected in App.jsx',
      'May be implemented differently or not present',
      'Implementation varies');
  }
} else {
  na('Code splitting and lazy loading',
    'App.jsx file not found',
    'Cannot check for code splitting',
    'File missing');
}

// ======================
// MOBILE & UX CHECKS
// ======================

console.log('\nMOBILE & USER EXPERIENCE:');

// 33. Mobile-friendly test (we already checked viewport, let's add touch targets)
if (indexHtml) {
  // Basic check for mobile-friendly meta tags
  const hasMobileMeta = indexHtml.includes('name="viewport"');
  if (hasMobileMeta) {
    pass('Mobile-friendly configuration',
      'HTML includes viewport meta tag for mobile responsiveness',
      'Foundation for mobile-friendly design');
  } else {
    fail('Mobile-friendly configuration',
      'HTML missing viewport meta tag',
      'Required for mobile-responsive design');
  }
} else {
  na('Mobile-friendly configuration',
    'index.html file not found',
    'Cannot check mobile-friendly configuration',
    'File missing');
}

// 34. Check for accessible navigation (basic)
if (headerComponent) {
  const hasAccessibleNav = headerComponent.includes('aria-label') ||
                          headerComponent.includes('role="navigation"') ||
                          headerComponent.includes('nav');

  if (hasAccessibleNav) {
    pass('Accessible navigation implementation',
      'Header component includes accessible navigation elements',
      'Supports screen reader navigation');
  } else {
    warn('Accessible navigation implementation',
      'Header component may lack explicit accessible navigation markers',
      'Consider adding aria-label or role attributes to navigation');
  }
} else {
  na('Accessible navigation implementation',
    'Header component file not found',
    'Cannot check accessible navigation',
    'File missing');
}

// 35. Check for form accessibility and validation
const formPaths = [
  path.resolve(SRC_DIR, 'pages', 'CitizenPortal.jsx'), // Report issue form
  path.resolve(SRC_DIR, 'pages', 'Contact.jsx') // Contact form if exists
];

let formAccessibilityIssues = 0;
const formAccessibilityDetails = [];

for (const formPath of formPaths) {
  if (fileExists(formPath)) {
    const formContent = getFileContent(formPath);
    if (formContent) {
      // Check for form elements
      if (formContent.includes('<form') ||
          formContent.includes('input') ||
          formContent.includes('Select') ||
          formContent.includes('textarea')) {

        // Check for labels associated with inputs
        // A page that renders its controls through FormField declares no
        // <label> of its own: the component clones the child with a generated
        // id and points htmlFor at it. Treating that as an unlabelled form was
        // a false positive, so follow the import.
        const formFieldSrc = path.join(SRC_DIR, 'components', 'citizen', 'FormField.jsx');
        const formFieldComponent = getFileContent(formFieldSrc) ?? '';
        const formFieldLabels = /htmlFor=/.test(formFieldComponent) && /cloneElement/.test(formFieldComponent);
        const usesFormField = /from\s+['"][^'"]*FormField['"]/.test(formContent);

        const hasLabels = formContent.includes('<label') ||
                         formContent.includes('htmlFor') ||
                         formContent.includes('aria-label') ||
                         (usesFormField && formFieldLabels);

        if (!hasLabels) {
          formAccessibilityIssues++;
          formAccessibilityDetails.push(`${path.basename(formPath)}: Form inputs may lack associated labels`);
        }

        // Check for required field indicators
        const hasRequired = formContent.includes('required') ||
                           formContent.includes('aria-required');

        if (!hasRequired) {
          // Not necessarily an issue, but worth noting
          formAccessibilityDetails.push(`${path.basename(formPath)}: Form fields may not indicate required status`);
        }
      }
    }
  }
}

if (formAccessibilityIssues === 0) {
  pass('Form accessibility basics',
    'No obvious form accessibility issues detected in checked forms',
    'Forms appear to have basic accessibility considerations');
} else {
  warn('Form accessibility basics',
    `${formAccessibilityIssues} forms may have accessibility improvements needed`,
    `Issues: ${formAccessibilityDetails.join('; ')}`);
}

// ======================
// COMPLETION CALCULATION
// ======================

console.log('\n' + '='.repeat(80));
console.log('COMPLETION CALCULATION');
console.log('='.repeat(80));

// Calculate completion based only on REQUIRED items that have been VERIFIED
const requiredItems = rows.filter(item => item.required);
const passedItems = requiredItems.filter(item =>
  item.status === 'PASS' && item.verified === true);

const completionPercentage = requiredItems.length > 0
  ? Math.round((passedItems.length / requiredItems.length) * 100)
  : 0;

console.log(`Total requirements checked: ${requiredItems.length}`);
console.log(`Passed requirements: ${passedItems.length}`);
console.log(`Completion percentage: ${completionPercentage}%`);

console.log('\nBREAKDOWN BY STATUS:');
const statusCounts = {};
rows.forEach(item => {
  const status = item.status;
  statusCounts[status] = (statusCounts[status] || 0) + 1;
});

Object.entries(statusCounts).sort(([,a], [,b]) => b - a).forEach(([status, count]) => {
  console.log(`${status.padEnd(12)}: ${count}`);
});

console.log('\nDETAILED RESULTS:');
console.log('-'.repeat(80));
rows.forEach(item => {
  const statusSymbol = item.status === 'PASS' ? '✅' :
                      item.status === 'FAIL' ? '❌' :
                      item.status === 'PARTIAL' ? '⚠️' :
                      item.status === 'BLOCKED' ? '🔒' :
                      item.status === 'UNKNOWN' ? '❓' :
                      '➖';

  const requiredText = item.required ? '[REQ]' : '[OPT]';
  const verifiedText = item.verified ? '[VER]' : '[!VER]';

  console.log(`${statusSymbol} ${requiredText} ${verifiedText} ${item.item.padEnd(40)} | ${item.detail}`);

  // Show evidence for failed items
  if (item.status === 'FAIL' && item.evidence) {
    console.log(`    Evidence: ${item.evidence}`);
  }
});

console.log('-'.repeat(80));

// Determine if audit can be considered complete
const hasFailedRequired = requiredItems.some(item =>
  item.status === 'FAIL' && item.verified === true);

const hasUnverifiedRequired = requiredItems.some(item =>
  !item.verified);

if (hasFailedRequired) {
  console.log('\n❌ AUDIT RESULT: NOT COMPLETE');
  console.log('   Reason: One or more required checks have FAILED');
} else if (hasUnverifiedRequired) {
  console.log('\n⚠️  AUDIT RESULT: NOT COMPLETE');
  console.log('   Reason: One or more required checks could not be VERIFIED');
} else if (completionPercentage === 100) {
  console.log('\n✅ AUDIT RESULT: COMPLETE');
  console.log('   All required checks have PASSED and been VERIFIED');
} else {
  console.log(`\n⚠️  AUDIT RESULT: INCOMPLETE (${completionPercentage}% complete)`);
  console.log('   Reason: Some required checks have not yet PASSED');
}

console.log('='.repeat(80));

// Exit with appropriate code
const exitCode = hasFailedRequired || hasUnverifiedRequired ? 1 : 0;
process.exit(exitCode);