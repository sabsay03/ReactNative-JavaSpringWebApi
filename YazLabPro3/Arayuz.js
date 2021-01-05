import React from 'react';
import {
  Image,
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import RNFetchBlob from 'react-native-fetch-blob'
import axios from 'axios'
import * as firebase from 'firebase';
import {
    launchCamera,
    launchImageLibrary
  } from 'react-native-image-picker';
import MainStore from './MainStore';
export default class App extends React.Component {
  state = {
    avatarSource: null,
    videoSource: null,
    refreshscreen:0,
    ObjelerinSayisi:0,
    objeler:"",

  };   
  constructor(props) {
    super(props);

    this.selectPhotoTapped = this.selectPhotoTapped.bind(this);
  
  }

  

  componentDidMount() {
    const config = {
        apiKey: 'AIzaSyDPazbRwqD3M7oCy9OY4ZUn_AFmH93Q1eQ',
        authDomain: 'nesnealgilama.firebaseapp.com',
        databaseURL: "https://nesnealgilama-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: 'nesnealgilama',
        storageBucket: 'nesnealgilama.appspot.com',
        messagingSenderId: '165732810337',
        };

    if (!firebase.apps.length) {
      firebase.initializeApp(config);
      console.log('Firebase entergasyonu tamam!');
    }
  }


  
  uploadImage = () => {

    const mime = 'image/jpg'
    const image = this.state.avatarSource
    const imageName = this.state.avatarName
    const Blob = RNFetchBlob.polyfill.Blob
    const fs = RNFetchBlob.fs;
  
    window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest
    window.Blob = Blob
    const Fetch = RNFetchBlob.polyfill.Fetch
    // replace built-in fetch
    window.fetch = new Fetch({
        auto : true,
        binaryContentTypes : [
            'image/',
            'video/',
            'audio/',
            'foo/',
        ]
    }).build()
    console.log("URI =>", image.uri);
    imgUri = image.uri;
    
    let uploadBlob = null
    const imageRef = firebase.storage().ref('avatars/' + imageName)
    const uploadUri =
      Platform.OS === "ios" ? imgUri.replace("file://", "") : imgUri;
    fs.readFile(uploadUri, 'base64')
    .then((data) => {
      return Blob.build(data, { type: `${mime};BASE64` })
    })
    .then((blob) => {
      uploadBlob = blob
      return imageRef.put(blob, { contentType: mime })
    })
    .then(() => {
      uploadBlob.close()
      return imageRef.getDownloadURL()
    })
    .then((url) => {
      MainStore.downloadurl=url;
      axios.post('https://nesnealgilama.ew.r.appspot.com/ImageProcess',{
          imageName: MainStore.imageName,
          downloadURL:MainStore.downloadurl,
          totalObjects:0,
          allObjects:"",

      }).then((response)=>{
        console.log(response.data.downloadURL)
        MainStore.SonucURL="https://firebasestorage.googleapis.com/v0/b/nesnealgilama.appspot.com/o/avatars%2FProcess"+response.data.imageName+".jpg?alt=media&token=x";
        this.state.ObjelerinSayisi=response.data.totalObjects
        this.state.ObjelerinSayisi= this.state.ObjelerinSayisi/4
        this.state.objeler=response.data.allObjects;


        console.log("Toplam Obje Sayısı:"+ this.state.ObjelerinSayisi);
        console.log("Tanımlanan Objeler:"+response.data.allObjects);
        this.setState({
          refreshscreen:this.state.refreshscreen+1,
        })
      }
        
        
        )
    })
    .catch((error) => {
      console.log(error)
    })

 
   
  }

  selectPhotoTapped() {
    const options = {
      quality: 1.0,
      maxWidth: 500,
      maxHeight: 500,
      noData: true,
    };

    launchImageLibrary(options, response => {
      
      console.log('Response => ', response);

      if (response.didCancel) {
        console.log('Kullanıcı fotoğraf seçim menüsünden çıktı. ');
      } else if (response.error) {
        console.log('ImagePicker Hatası: ', response.error);
      } else if (response.customButton) {
        console.log('Custom butona basıldı: ', response.customButton);
      } else {
        
        this.setState({
          avatarSource: response,
          avatarName: response.fileName
        });
        
        console.log(" Image Source (Response) =>" , this.state.avatarSource)
        console.log(" Image URI =>" , this.state.avatarSource.uri)
        console.log(" Image Name =>" , this.state.avatarName)
        MainStore.setimageName(this.state.avatarName);
      
      }
    });
  }

   requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission',
          },
        );
        // If CAMERA Permission is granted
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else return true;
  };
   requestExternalWritePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'External Storage Write Permission',
            message: 'App needs write permission',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        alert('Write permission err', err);
      }
      return false;
    } else return true;
  };
   captureImage = async () => {
    let options = {
      mediaType: 'photo',
      maxWidth: 300,
      maxHeight: 550,
      quality: 1,
      videoQuality: 'low',
      durationLimit: 30, //Video max duration in seconds
      saveToPhotos: true,
    };
    
  
      launchCamera(options, (response) => {
        console.log('Response = ', response);

        if (response.didCancel) {
          alert('User cancelled camera picker');
          return;
        } else if (response.errorCode == 'camera_unavailable') {
          alert('Camera not available on device');
          return;
        } else if (response.errorCode == 'permission') {
          alert('Permission not satisfied');
          return;
        } else if (response.errorCode == 'others') {
          alert(response.errorMessage);
          return;
        }
        console.log('base64 -> ', response.base64);

        this.setState({
          avatarSource: response,
          avatarName: response.fileName
        });
       
        console.log('uri -> ', response.uri);
        console.log('width -> ', response.width);
        console.log('height -> ', response.height);
        console.log('fileSize -> ', response.fileSize);
        console.log('type -> ', response.type);
        console.log('fileName -> ', response.fileName);
        MainStore.imageName=response.fileName;
        
        
      });
    
  };

  render() {
    const { avatarSource } = this.state; 
    return (
      
      <View style={styles.container}>
        <View style={styles.containerrow}>
        <TouchableOpacity onPress={this.selectPhotoTapped.bind(this)}>
          <View 
            style={[styles.avatar, {marginBottom: 20,}]}>
      
              <Text>Pick Photo</Text>
          
          </View>
        </TouchableOpacity>

        {this.state.videoSource && (
          <Text style={{margin: 8, textAlign: 'center'}}>
            {this.state.videoSource}
          </Text>
        )}

      <TouchableOpacity onPress={this.uploadImage}>
          <View
            style={[styles.image, {marginBottom: 20,marginRight:10,marginLeft:10,}]}>
               {this.state.avatarSource === null ? (
              <Text> </Text>
            ) : (
              <Image style={styles.image} source={{uri: avatarSource.uri}} />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={this.captureImage}>
          <View
            style={[styles.avatar, {marginBottom: 20}]}>
          
              <Text>Take a Photo</Text>
          
          </View>
        </TouchableOpacity>

        {this.state.videoSource && (
          <Text style={{margin: 8, textAlign: 'center'}}>
            {this.state.videoSource}
          </Text>
        )}

       </View>

       <View>
          <Text style={styles.text}>
            Number of Object:{this.state.ObjelerinSayisi}
            
          </Text>
          <Text style={styles.text}>
            Objects:{this.state.objeler}
            
          </Text>

       </View>

  <TouchableOpacity onPress={this.uploadImage}>
  <View
            style={[styles.bigImage, {marginBottom: 20}]}>
            {MainStore.SonucURL === null ? (
              <Text>Upload Photo</Text>
            ) : (
              <Image style={styles.bigImage} source={{uri: MainStore.SonucURL }} />
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0081CF',
  },
  containerrow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0081CF',
    flexDirection:'row',
  
  },
  avatar: {
    width: 100,
    height: 50,
    borderColor: '#B39CD0',
    borderWidth: 2 ,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'#D8EFF8'

  },
  bigImage: {
    resizeMode:'stretch',
    width: 400,
    height: 400,
    borderWidth:5,
    borderColor:'#00C9A7',
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#00C9A7',
    borderRadius:60

  },
  image: {
    resizeMode:'stretch',
    width: 180,
    height: 162,
    borderRadius:40,
    borderColor:'#00C9A7',
    borderWidth:1,
    borderColor:'#00C9A7'
  },
  text:{
    marginBottom:5,
    backgroundColor:'#D8EFF8',
    borderWidth:2,
    borderColor:'#D8EFF8'
  }


});