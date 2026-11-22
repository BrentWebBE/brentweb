import type { Metadata } from 'next'

import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React from 'react'

import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { ProjectDetail } from '@/components/projects/ProjectDetail'
import { isProjectsSegment, projectHref } from '@/lib/routing'
import { pageMetadata } from '@/utilities/pageMeta'
import { getAlternates, getProject } from '@/utilities/queries'

import { resolveLocale } from '../../renderPage'

type Args = { params: Promise<{ locale: string; slug: string; child: string }> }

/** /{locale}/{projecten|work}/{project}. Any other two-level path is a 404. */
export default async function ProjectPage({ params }: Args) {
  const { locale: rawLocale, slug, child } = await params
  const locale = resolveLocale(rawLocale)
  if (!isProjectsSegment(locale, slug)) notFound()

  const decoded = decodeURIComponent(child)
  const [project, { isEnabled: draft }] = await Promise.all([
    getProject(locale, decoded),
    draftMode(),
  ])
  // A renamed project's old URL redirects (see redirectOnSlugChange); otherwise 404.
  if (!project) return <PayloadRedirects locale={locale} url={projectHref(locale, decoded)} />

  return (
    <>
      {draft && <LivePreviewListener />}
      <ProjectDetail locale={locale} project={project} />
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: rawLocale, slug, child } = await params
  const locale = resolveLocale(rawLocale)
  if (!isProjectsSegment(locale, slug)) return {}
  const project = await getProject(locale, decodeURIComponent(child))
  if (!project) return {}
  const path = projectHref(locale, project.slug)
  return pageMetadata({
    alternates: await getAlternates(path),
    description: project.abstract,
    doc: project,
    locale,
    path,
  })
}
