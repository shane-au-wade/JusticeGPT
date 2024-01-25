import React from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const STARTING_MAP_LOCATION = {
  lat: 51.04,
  lng: -114.05,
  zoom: 9,
}

const CALGARY_MARKER_POINT = [51.27066867, -114.32722807]

export default function Map(props) {
  const {setMap} = props

  const ref = React.useRef()

  React.useLayoutEffect(() => {
    // tile layers
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 25,
    })

    const map = L.map(ref.current, {
      doubleClickZoom: false,
      zoomControl: false,
      // dragging: false,
      renderer: L.canvas({ padding: 0.8, tolerance: 3 }),
      attributionControl: false,
      layers: [osm],
    })

    // init map position
    const lat = STARTING_MAP_LOCATION.lat
    const lng = STARTING_MAP_LOCATION.lng
    const zoom = STARTING_MAP_LOCATION.zoom
    const latLng = L.latLng(lat, lng)
    map.setView(latLng, zoom)

    const threshold_attribution = L.control.attribution({ prefix: 'Threshold UAV' })

    threshold_attribution.addTo(map)

    map.getPane('mapPane').style.zIndex = '1'

    setMap(map)

    return () => {
      setMap(null)
      map.off()
      map.remove()
    }
  }, [ref, setMap])

  return (
    <div
      id="map_container"
      ref={ref}
      style={{
        height: '100%',
        width: '100%',
        borderRadius: '7px',
        background: '#2B2933',
        zIndex: '1',
      }}
    ></div>
  )
}
