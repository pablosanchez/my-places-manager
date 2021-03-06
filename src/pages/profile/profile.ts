import { Component } from '@angular/core';
import { IonicPage, NavController, FabContainer } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Observable } from 'rxjs/Observable';
import { AuthProvider } from '../../providers/auth/auth';
import { UserDataProvider } from '../../providers/user-data/user-data';
import { UtilsProvider } from '../../providers/utils/utils';

@IonicPage()
@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
})
export class ProfilePage {

  user: Observable<any>;

  constructor(public navCtrl: NavController, private authData: AuthProvider,
    private userData: UserDataProvider, private camera: Camera,
    private utils: UtilsProvider) { }

  ionViewDidLoad() {
    this.user = this.userData.getUserData();
  }

  onFabClicked(fab: FabContainer, isCamera: boolean) {
    fab.close();

    let cameraOptions: CameraOptions = {
      quality: 70,
      destinationType: this.camera.DestinationType.DATA_URL,
      mediaType: this.camera.MediaType.PICTURE,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation: true
    };

    if (isCamera) {
      cameraOptions.saveToPhotoAlbum = true;
    } else {
      // Open device gallery
      cameraOptions.sourceType = this.camera.PictureSourceType.SAVEDPHOTOALBUM;
    }

    this.camera.getPicture(cameraOptions)
    .then(imageData => {
      let loading = this.utils.showLoading('Subiendo imagen...');
      this.userData.uploadImage(null, imageData)
      .then(() => loading.dismiss());
    }, err => this.utils.showAlert(err, false)); 
  }

  goToLists() {
    this.navCtrl.setRoot('MyListsPage');
  }

  logoutUser() {
    this.authData.logoutUser();
  }
}
