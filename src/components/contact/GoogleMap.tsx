'use client'

import { useEffect } from 'react'
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'
import { useTheme } from '@/providers/Theme'
import type { MapLocation } from './MapFacade'

/**
 * The Google maps, one per location side by side. Only ever imported by MapFacade
 * after the visitor asks for it, so neither this module nor the Maps API loads with
 * the page.
 */
export default function GoogleMap({
  apiKey,
  locations,
  onError,
  paneClassName,
  labelClassName,
}: {
  apiKey: string
  locations: MapLocation[]
  onError: () => void
  paneClassName: string
  labelClassName: string
}) {
  const { theme } = useTheme()

  // A rejected key (expired, wrong referrer) doesn't reach onError: Google
  // calls this global and paints "Sorry! Something went wrong" instead.
  useEffect(() => {
    const w = window as Window & { gm_authFailure?: () => void }
    w.gm_authFailure = onError
    return () => {
      delete w.gm_authFailure
    }
  }, [onError])

  return (
    <APIProvider apiKey={apiKey} onError={onError}>
      {locations.map((place) => (
        <figure key={place.name} className="m-0">
          <div className={paneClassName}>
            <Map
              defaultCenter={{ lat: place.lat, lng: place.lng }}
              defaultZoom={12}
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={true}
              colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
              gestureHandling="cooperative"
              className="size-full"
            >
              <Marker position={{ lat: place.lat, lng: place.lng }} title={place.name} />
            </Map>
          </div>
          <figcaption className={labelClassName}>{place.name}</figcaption>
        </figure>
      ))}
    </APIProvider>
  )
}
