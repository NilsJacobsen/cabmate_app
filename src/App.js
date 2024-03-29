import './App.css';

import  { useState, useEffect, useMemo, useCallback } from 'react';
import { updatePercentiles } from './utility';
import bbox from '@turf/bbox';
import { easeCubic } from 'd3-ease';
import data from './data.json';
import exampleData from './example.json';
import { BrowserRouter as Router, Switch, Route, Link, useHistory } from "react-router-dom";
import Setting from './pages/setting';
import Map from './pages/map';
import Stats from './pages/stats';
import Account from './pages/account';
import Start from './pages/start';

import ReactMapGL, { Marker, Source, Layer, LinearInterpolator, WebMercatorViewport} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';

// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

export default function App() {
  const [isDetailView, setDetailView] = useState(false);
  const [viewport, setViewport] = useState({
    latitude: 40.640927,
    longitude: -73.973601,
    zoom: 13,
    width: "100vw",
    height: "100vh",
  });
  const [selectedDistric, setSelectedDistrict] = useState('188');
  let history = useHistory();

  const computedData = useMemo(() => {
    return data && updatePercentiles(data, exampleData, viewport);
  }, [data, exampleData]);
  const sortedArray = computedData.features.sort(function (a, b) {
    return b.properties.score - a.properties.score;
  });
  const shortedArray = sortedArray.slice(0,10);

  function clickHandler(event){
    const feature = event.features[0];
    console.log(feature);
    if (feature) {
      // calculate the bounding box of the feature
      const [minLng, minLat, maxLng, maxLat] = bbox(feature);
      // construct a viewport instance from the current state
      const vp = new WebMercatorViewport(viewport);
      const {longitude, latitude, zoom} = vp.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat]
        ],
        {
          padding: 120
        }
      );
      setSelectedDistrict(feature.properties.location_id);
      setDetailView(true);
      setViewport({
        ...viewport,
        longitude,
        latitude: latitude - 0.02,
        zoom,
        transitionInterpolator: new LinearInterpolator({
          around: [event.offsetCenter.x, event.offsetCenter.y]
        }),
        transitionDuration: 1000,
        transitionEasing: easeCubic
      });
    }
  }
  const newFeature = computedData.features.find(({ properties }) => properties.location_id === selectedDistric);

  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/settings">
            <Setting />
          </Route>
          <Route path="/map">
            <Map computedData={computedData} newFeature={newFeature} viewport={viewport} setViewport={setViewport} clickHandler={clickHandler} shortedArray={shortedArray} isDetailView={isDetailView} setDetailView={setDetailView} setSelectedDistrict={setSelectedDistrict}/>
          </Route>
          <Route path="/stats">
            <Stats />
          </Route>
          <Route path="/account">
            <Account />
          </Route>
          <Route path="/">
            <Start history={history}/>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}