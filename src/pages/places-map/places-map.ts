import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, AlertController, Events, Platform,
  Loading, LoadingController } from 'ionic-angular';
import { GoogleMaps, GoogleMap, GoogleMapsEvent, MarkerCluster,
  MarkerOptions, Marker } from '@ionic-native/google-maps';
import { Geolocation } from '@ionic-native/geolocation';
import { PlacesDataProvider } from '../../providers/places-data/places-data';
import { Utils } from './../../utils/utils';
import { Place } from '../../interfaces/place';

interface Position {
  lat: number,
  lng: number
}

@IonicPage()
@Component({
  selector: 'page-places-map',
  templateUrl: 'places-map.html',
})
export class PlacesMapPage {

  @ViewChild('map') mapRef: ElementRef;

  map: GoogleMap;
  markerCluster: MarkerCluster;

  places: Place[] = [];

  loading: Loading;

  // Events
  loadMorePlaces: string = 'loadMorePlaces';
  finish: string = 'finish';

  constructor (private platform: Platform, private googleMaps: GoogleMaps,
    private loadingCtrl: LoadingController, private geolocation: Geolocation,
    private alertCtrl: AlertController, private placesProvider: PlacesDataProvider,
    private events: Events) { 
      this.events.subscribe(this.loadMorePlaces, (input, token) => {
        this.loadPlaces(input, token);
      });
      this.events.subscribe(this.finish, () => {
        this.onPlacesLoaded();
      });
    }

  ionViewDidLoad() {
    this.platform.ready().then(() => {
      this.loadMap();
    });
  }
  
  loadMap() {
    this.map = this.googleMaps.create(this.mapRef.nativeElement);

    // Wait until map is ready
    this.map.one(GoogleMapsEvent.MAP_READY)
    .then(() => {
      this.map.setAllGesturesEnabled(true);
      this.getUserLocation();
    });
  }

  getUserLocation() {
    this.geolocation.getCurrentPosition()
    .then(data => {
      this.centerMapInPosition({
        lat: data.coords.latitude,
        lng: data.coords.longitude
      });
    })
    .catch(err => {
      Utils.showErrorAlert(this.alertCtrl,
        'Error al obtener la ubicación del usuario: ' + err.message);
    });
  }

  centerMapInPosition(location: Position) {
    let lat = location.lat;
    let lng = location.lng;
    let options = {
      target: { lat: lat, lng: lng },
      zoom: 12,
      duration: 1000
    };

    // Add a marker in user's position
    this.map.addMarker({
      title: 'Tu posición',
      icon: 'assets/imgs/user_marker.png',
      animation: 'DROP',
      position: {
        lat: lat,
        lng: lng
      }
    })
    .then(marker => {
      marker.showInfoWindow();
    });

    this.map.animateCamera(options);
  }

  onInput(input: string) {
    // Remove old cluster if there is one
    if (this.markerCluster) {
      this.markerCluster.remove();
    }
    this.loading = Utils.showLoading(this.loadingCtrl, 'Cargando lugares...');
    this.loadPlaces(input);
  }

  loadPlaces(input: string, token?: string) {
    this.placesProvider.performTextSearch(input, token)
    .subscribe(data => {
      data.results.forEach(place => this.places.push(place));
      if (data.next_page_token) {
        this.events.publish(this.loadMorePlaces, input, data.next_page_token);
      } else {
        this.events.publish(this.finish);
      }
    });
  }

  onPlacesLoaded() {
    let markers: MarkerOptions[] = [];

    for (let place of this.places) {
      markers.push({
        place_id: place.place_id, // Necessary to load place details
        title: place.name,
        icon: 'blue',
        animation: 'DROP',
        position: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        }
      });
    }

    this.loading.dismiss();
    this.addCluster(markers);
  } 

  addCluster(markers: MarkerOptions[]) {
    this.map.addMarkerCluster({
      markers: markers,
      icons: [
        { min: 2, max: 40, url: "assets/imgs/cluster_marker.png", anchor: { x: 16, y: 16 } }
      ]
    })
    .then((markerCluster: MarkerCluster) => {
      this.markerCluster = markerCluster;

      // Add on click listener for every marker
      markerCluster.on(GoogleMapsEvent.MARKER_CLICK)
      .subscribe(params => {
        let marker: Marker = params[1];
        marker.showInfoWindow();
        setTimeout(this.getPlaceDetails(marker.get('place_id')), 1000);
      });
    });
  }

  getPlaceDetails(placeId: string) {

  }
}
