# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build production optimized bundle
- `npm run preview` - Preview production build locally
- `npm run audit` - Run full SEO and syntax audit (combines syntax and SEO checks)
- `npm run audit:seo` - Run SEO-specific audit only
- `npm run audit:syntax` - Run syntax checking only
- `npm run validate:schema` - Validate structured data implementation

## Code Architecture

### Frontend Structure
- **`/frontend/src/`** - Main React application source
  - **`/frontend/src/pages/`** - Page-level components (Home, CitizenPortal, HowItWorks, etc.)
  - **`/frontend/src/components/`** - Reusable UI components (SEO, GA4, Header, Footer, Breadcrumb, etc.)
  - **`/frontend/src/App.jsx`** - Main application component with routing and SEO wrapper implementation
  - **`/frontend/src/components/SEO.jsx`** - Central SEO component that generates dynamic meta tags, structured data, and handles schema.org JSON-LD injection
  - **`/frontend/src/components/GA4.jsx`** - Google Analytics 4 integration with Web Vitals and custom event tracking
  - **`/frontend/src/components/Header.jsx`** and **`Footer.jsx`** - Site navigation with accessibility features
  - **`/frontend/src/pages/NotFound.jsx`** - Custom 404 page component

### Key Implementation Patterns
- **SEO Wrapper Pattern**: All routes in App.jsx wrap page components with `<SEO>` component to generate dynamic meta tags per page
- **Schema.org Implementation**: SEO.jsx generates JSON-LD structured data for multiple types (Organization, WebSite, FAQPage, HowTo, etc.) based on page type
- **Accessibility Focus**: Components include proper ARIA labels, semantic HTML, and keyboard navigation considerations
- **Performance Optimizations**: Uses Vite's built-in optimization, lazy image loading, and preconnect/preload directives
- **AI Readiness**: llms.txt file provides training data for AI crawlers and LLMs

### Static Assets and Configuration
- **`/frontend/public/`** - Static assets served at root
  - `index.html` - Main HTML template with meta tags, viewport, and performance hints
  - `sitemap.xml` - XML sitemap with hreflang support for multilingual SEO
  - `robots.txt` - Robots.txt with rules for crawlers and sitemap reference
  - `llms.txt` - AI training data file for LLMs and AI crawlers
  - `og-samadhan.png` - Open Graph image
  - `favicon.svg` and `Samadhan.png` - Site icons
- **`/frontend/vercel.json`** - Vercel configuration for redirects, headers (including security headers), clean URLs, and trailing slash handling
- **`/frontend/scripts/`** - Utility scripts for SEO validation, schema validation, and syntax checking

## Important Files for Development

- **SEO Component**: `/frontend/src/components/SEO.jsx` - Central to dynamic meta tag generation and structured data (lines 36-38 show dynamic title/meta description generation)
- **Routing**: `/frontend/src/App.jsx` - Demonstrates SEO-wrapped route pattern where each route wraps page components with `<SEO>` and passes appropriate `title`, `description`, and `schema` props
- **Analytics**: `/frontend/src/components/GA4.jsx` - GA4 implementation with custom events (cta_click, form_submit) and Web Vitals tracking
- **Audit Scripts**: `/frontend/scripts/` - Contains:
  - `seo-audit.mjs` - Original technical SEO audit
  - `check-syntax.mjs` - Syntax validation
  - `validate-schema.mjs` - Structured data validation
  - `comprehensive-seo-audit.mjs` - New comprehensive SEO audit with accurate completion calculation
- **Configuration**: `frontend/vercel.json` - Critical for SEO-related headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, etc.) and clean URL configuration

## SEO-Specific Development Guidelines

When developing new pages or modifying existing ones:
1. **All page components must be wrapped with `<SEO>` component** in App.jsx to generate proper dynamic meta tags
2. The SEO component requires `title` and `description` props for dynamic meta tag generation
3. Structured data/schema should be passed as the `schema` prop to the SEO component for JSON-LD generation
4. Every `<img>` needs an `alt` attribute. There is no `LazyImage` component — it was deleted after an audit showed no page imported it. Below-the-fold imagery must also set `loading="lazy"`; the above-the-fold header logo must not
5. Headers should follow H1-H6 hierarchy with exactly one H1 per page for semantic structure and SEO
6. Custom 404 pages should provide helpful navigation options and clear messaging
7. Follow accessibility best practices including proper ARIA labels, semantic HTML, and keyboard navigation
8. When adding new structured data types, extend the schema generation logic in SEO.jsx appropriately
9. Monitor performance using the Web Vitals tracking already integrated in GA4.jsx
10. Ensure all new static assets are referenced in index.html with appropriate preload/preconnect hints where needed

## Project Type
This is a React/Vite TypeScript-aware JavaScript project using TailwindCSS for styling, focused on implementing comprehensive SEO best practices for a civic-tech platform serving Indian government officials and citizens. The implementation follows modern SEO practices including technical SEO, on-page optimization, structured data, accessibility, performance optimization, and AI readiness.

The project uses Vite's built-in TypeScript support (tsconfig.json) and proxies API requests to a backend server during development.