/** SEO Document Head component for Samadhan */
import { useEffect, useState } from 'react'

const SITE_NAME = 'Samadhan'
const SITE_URL = 'https://samadhan-chi.vercel.app'

// Default metadata per page path
const pageMetadata = {
  '/': {
    title: 'Report Constituency Issues - Samadhan',
    description: 'Register your grievance with verified contact details. Your identity is kept confidential from the public dashboard.',
    schemaType: 'WebSite'
  },
  '/mp/login': {
    title: 'MP / Staff Login - Samadhan',
    description: 'Secure access for elected representatives to view constituency dashboard, grievance map, and MPLADS prioritization.',
    schemaType: 'WebPage'
  },
  '/mp': {
    title: 'MP Executive Dashboard - Samadhan',
    description: 'MPLADS prioritization dashboard for MP office - view prioritized infrastructure projects and citizen grievances.',
    schemaType: 'WebPage'
  },
  '/report-issue': {
    title: 'Report a Constituency Issue - Samadhan',
    description: 'Register your grievance with verified contact details. Your identity is kept confidential from the public dashboard.',
    schemaType: 'WebPage'
  },
}

export default function SEO({
  title,
  description,
  type = '/',
  images = [{
    url: `${SITE_URL}/favicon.svg`,
    width: 1024,
    height: 1024,
    alt: 'Samadhan logo'
  }]
}) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized) return
    setInitialized(true)

    // Get the pathname - handle both string type and location object
    const pathName = typeof type === 'string' ? type : (type.pathname || '/')

    // Determine page-specific title and description from metadata
    const meta = pageMetadata[pathName] || pageMetadata['/']
    const pageTitle = title || meta.title
    const pageDescription = description || meta.description

    // Update document title
    document.title = pageTitle

    // Remove existing SEO meta tags to avoid duplicates
    const existingMeta = document.querySelectorAll('meta[name], meta[property], link[rel="canonical"], script[type="application/ld+json"]')
    existingMeta.forEach(el => el.remove())

    // Helper to create meta tags
    const addMeta = (attrs) => {
      const element = document.createElement('meta')
      Object.keys(attrs).forEach(key => {
        if (key === 'name' || key === 'property') {
          element[key] = attrs[key]
        } else if (key === 'content') {
          element.content = attrs[key]
        } else if (key === 'charset') {
          element.charset = attrs[key]
        } else if (key === 'rel') {
          element.rel = attrs[key]
        } else if (key === 'href') {
          element.href = attrs[key]
        } else if (key === '') {
          // skip
        } else {
          element.setAttribute(key, attrs[key])
        }
      })
      document.head.appendChild(element)
    }

    // Helper to create script tags
    const addScript = (attrs, content) => {
      const element = document.createElement('script')
      Object.keys(attrs).forEach(key => {
        element.setAttribute(key, attrs[key])
      })
      if (content) {
        element.textContent = content
      }
      document.head.appendChild(element)
    }

    // Add all SEO meta tags
    addMeta({ charset: 'utf-8' })

    addMeta({ name: 'description', content: pageDescription })

    addMeta({ name: 'robots', content: 'index, follow' })

    addMeta({
      rel: 'canonical',
      href: `${SITE_URL}${pathName}`
    })

    // Open Graph tags
    addMeta({ property: 'og:title', content: pageTitle })
    addMeta({ property: 'og:description', content: pageDescription })
    addMeta({ property: 'og:type', content: 'website' })
    addMeta({ property: 'og:url', content: `${SITE_URL}${pathName}` })
    addMeta({ property: 'og:site_name', content: SITE_NAME })
    addMeta({ property: 'og:image', content: images[0].url })

    // Twitter card tags
    addMeta({ name: 'twitter:card', content: 'summary' })
    addMeta({ name: 'twitter:title', content: pageTitle })
    addMeta({ name: 'twitter:description', content: pageDescription })
    addMeta({ name: 'twitter:image', content: images[0].url })

    // Google Site Verification
    addMeta({ name: 'google-site-verification', content: 'googlea34e147e07ede164' })

    // JSON-LD Structured Data
    let schemaData = {}

    switch (meta.schemaType) {
      case 'WebSite':
        schemaData = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": SITE_NAME,
          "url": SITE_URL,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${SITE_URL}/search?={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        }
        break

      case 'WebPage':
        schemaData = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": pageTitle,
          "description": pageDescription,
          "url": `${SITE_URL}${pathName}`,
          "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": SITE_URL,
            "logo": {
              "@type": "ImageObject",
              "url": `${SITE_URL}/favicon.svg`
            }
          }
        }
        break

      default:
        schemaData = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": pageTitle,
          "description": pageDescription,
          "url": `${SITE_URL}${pathName}`
        }
    }

    addScript(
      { type: "application/ld+json" },
      JSON.stringify(schemaData, null, 2)
    )
  }, [initialized, title, description, type, images])

  return null
}