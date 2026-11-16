'use client'

import { lazy, Suspense, useCallback, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useTranslations } from '@/hooks/useTranslations'
import { cn } from '@/utilities/ui'

const GoogleMap = lazy(() => import('./GoogleMap'))

export type MapLocation = { name: string; lat: number; lng: number }

/** Half the width and height of the OpenStreetMap frame, in degrees (≈ Google's zoom 12). */
const OSM_SPAN = { lng: 0.06, lat: 0.035 }

/** "minLng,minLat,maxLng,maxLat" around a point, for the OSM embed. */
function osmBbox({ lat, lng }: MapLocation): string {
  return [lng - OSM_SPAN.lng, lat - OSM_SPAN.lat, lng + OSM_SPAN.lng, lat + OSM_SPAN.lat]
    .map((n) => n.toFixed(4))
    .join(',')
}

/** Keys shorter than this, or the .env.example placeholder, count as "no key". */
function usableKey(key: string | null | undefined): string | null {
  const trimmed = key?.trim()
  return trimmed && trimmed.length > 10 && !trimmed.startsWith('your_') ? trimmed : null
}

const paneClassName =
  'sketch-frame aspect-[4/3] w-full overflow-hidden [&_iframe]:size-full [&_iframe]:border-0'
const labelClassName = 'hand mt-2 text-center text-2xl text-muted-foreground'

/**
 * Click-to-load map. The page itself never contacts Google (or OpenStreetMap):
 * until the visitor presses the button there is only a local, drawn placeholder, so
 * no third party learns about the visit and the Maps API stays off the page. After
 * the click the Google map loads, or the OpenStreetMap embed when no key is given or
 * Google fails. One pane per location, side by side.
 *
 * `googleMapsKey` is read on the server (runtimeEnv('GOOGLE_MAPS_API_KEY')) and
 * passed down; the image is built without env, so the browser can't read it itself.
 */
export function MapFacade({
  locations,
  googleMapsKey,
  className,
}: {
  locations: MapLocation[]
  googleMapsKey?: string | null
  className?: string
}) {
  const { t } = useTranslations()
  const [active, setActive] = useState(false)
  const [mapError, setMapError] = useState(false)
  const onError = useCallback(() => setMapError(true), [])
  const apiKey = usableKey(googleMapsKey)

  if (locations.length === 0) return null
  const grid = cn('grid gap-6', locations.length > 1 && 'sm:grid-cols-2', className)

  if (!active) {
    return (
      <div
        className={cn(
          'paper-sheet relative grid min-h-64 place-items-center overflow-hidden p-8 text-center',
          className,
        )}
      >
        {/* A pencil grid, standing in for a map until the visitor asks for one. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:2.5rem_2.5rem] [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]"
        />
        <div className="relative grid justify-items-center gap-5">
          <ul
            className="flex flex-wrap justify-center gap-x-8 gap-y-2"
            aria-label={t('contact.map.places')}
          >
            {locations.map((place, i) => (
              <li
                key={place.name}
                className={cn(
                  'hand flex items-center gap-1.5 text-3xl',
                  i % 2 ? 'rotate-2' : '-rotate-2',
                )}
              >
                <MapPin aria-hidden className="size-6 text-primary" />
                {place.name}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setActive(true)} className="btn btn-ghost bg-card">
            {apiKey ? t('contact.map.showGoogle') : t('contact.map.showOsm')}
          </button>
        </div>
      </div>
    )
  }

  if (!apiKey || mapError) {
    return (
      <div className={grid}>
        {locations.map((place) => (
          <figure key={place.name} className="m-0">
            <div className={paneClassName}>
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(osmBbox(place))}&layer=mapnik&marker=${place.lat},${place.lng}`}
                title={t('contact.map.title', { place: place.name })}
                loading="lazy"
              />
            </div>
            <figcaption className={labelClassName}>{place.name}</figcaption>
          </figure>
        ))}
        {mapError && (
          <p className="text-sm text-muted-foreground sm:col-span-full">{t('contact.map.error')}</p>
        )}
      </div>
    )
  }

  return (
    <div className={grid}>
      <Suspense fallback={<div className={paneClassName} />}>
        <GoogleMap
          apiKey={apiKey}
          locations={locations}
          onError={onError}
          paneClassName={paneClassName}
          labelClassName={labelClassName}
        />
      </Suspense>
    </div>
  )
}
