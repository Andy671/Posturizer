import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'antd/dist/antd.css'
import { Button, Layout, Menu, Icon } from 'antd'
import Dashboard from '../components/Dashboard'
import InvisibleCamera from '../components/InvisibleCamera'
import '../static/css/styles.scss'
import axios from 'axios'
import * as credentials from '../credentials.js'

const { Header, Content, Sider } = Layout

const POSTURES = ['good', 'left', 'right', 'front', 'back']
const POSTURE_LABELS = ['Good Posture', 'Left Incline', 'Right Incline', 'Front Incline', 'Back Incline']
const INTERVAL_MILLIS = 10000

class Index extends React.Component {
  state = {
    isUserLoggedIn: false,
    currentMenu: 'dashboard',
    isTracking: false,
    dataset: [],
  }

  constructor(props) {
    super(props)

    let firebaseConfig = {
      apiKey: credentials.FIREBASE_API_KEY,
      authDomain: credentials.FIREBASE_AUTH_DOMAIN,
      databaseURL: credentials.FIREBASE_DATABASE_URL,
      projectId: credentials.FIREBASE_PROJECT_ID,
      messagingSenderId: credentials.FIREBASE_MESSAGING_SENDER_ID,
      appId: credentials.FIREBASE_APP_ID
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig)
    }

    this.firestoreDb = firebase.firestore()

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.userLoggedIn(user.email)
      } else {
        this.userLoggedOut()
      }
    })
  }

  componentDidMount() {
    this.notifications = {}
    POSTURES.forEach(posture => {
      this.notifications[posture] = new Audio(`/static/sounds/${posture}.mp3`)
    })
  }

  render() {
    if (this.state.isUserLoggedIn) {
      return (
        <Layout style={{ minHeight: '100vh' }}>
          <Header className='header-title'> <Icon type='crown' />Posturizer</Header>
          <Layout>
            <InvisibleCamera
              isUserLoggedIn={this.state.isUserLoggedIn}
              cameraShotIntervalMillis={INTERVAL_MILLIS}
              isTracking={this.state.isTracking}
              onCameraShot={(image) => this.onCameraShot(image)} />
            <Sider collapsible>
              <Menu onClick={event => this.handleSideMenu(event)} className='left-side-menu'
                theme='dark' defaultSelectedKeys={[this.state.currentMenu]} mode='inline'>
                <Menu.Item key={'dashboard'}>
                  <Icon type='pie-chart' />
                  <span>Dashboard</span>
                </Menu.Item>
                <Menu.Item onClick={() => this.onLogoutClick()} key={'logout'}>
                  <Icon type='logout' />
                  <span>Logout</span>
                </Menu.Item>
              </Menu>
            </Sider>
            <Content>
              {this.renderMenu()}
            </Content>
          </Layout>
        </Layout >
      )
    }
    return (
      <div className='login-button-div'>
        <div><Icon type='crown' />Posturizer</div>
        <Button size='large' type='primary' onClick={() => this.onLoginClick()}>Login with Google</Button>
      </div>
    )
  }
  renderMenu() {
    switch (this.state.currentMenu) {
      case 'dashboard':
        return <Dashboard
          postures={POSTURES}
          postureLabels={POSTURE_LABELS}
          dataset={this.state.dataset}
          isTracking={this.state.isTracking}
          onStartStopClick={() => this.onStartStopClick()} />
      default:
        return <React.Fragment></React.Fragment>
    }
  }

  handleSideMenu(event) {
    if (this.state.currentMenu == event.key)
      return
    this.setState({ currentMenu: event.key })
  }

  async onLoginClick() {
    let provider = new firebase.auth.GoogleAuthProvider()

    try {
      let result = await firebase.auth().signInWithPopup(provider)
      let email = result.user.email
    } catch (error) {
      console.log(error)
    }
  }

  async onLogoutClick() {
    console.log('On Log Out Click')
    try {
      await firebase.auth().signOut()
      console.log('signOut() Success')
    } catch (error) {
      console.log(error)
    }
  }

  async userLoggedIn(email) {
    this.setState({ isUserLoggedIn: true })
    this.userEmail = email
    this.retrieveDataset()
    console.log(`${email} Logged In`)
  }

  async userLoggedOut() {
    this.setState({ isUserLoggedIn: false })
    this.userEmail = null
    console.log('Logged Out')
  }

  async submitNewData(status) {
    try {
      let querySnapshot = await this.firestoreDb.collection('users').where('email', '==', this.userEmail).limit(1).get().then()
      await this.firestoreDb.doc(`users/${querySnapshot.docs[0].id}`).collection('dataset').add({
        status: status,
        time: firebase.firestore.Timestamp.fromDate(new Date())
      })
    } catch (error) {
      console.log(error)
    }
  }

  async retrieveDataset() {
    try {
      let querySnapshot = await this.firestoreDb.collection('users').where('email', '==', this.userEmail).limit(1).get().then()
      let datasetCollection
      if (querySnapshot.docs.length == 0) {
        let newUser = this.firestoreDb.collection(`users`).doc()
        let dbNewUser = await newUser.set({
          email: this.userEmail
        })
        datasetCollection = await this.firestoreDb.doc(`users/${dbNewUser.id}`).collection('dataset').get().then()
      } else {
        datasetCollection = await this.firestoreDb.doc(`users/${querySnapshot.docs[0].id}`).collection('dataset').get().then()
      }
      let dataset = []
      datasetCollection.docs.forEach(document => {
        let seconds = document.data().time.seconds
        let _7days = new Date()
        _7days.setDate(_7days.getDate() - 7)
        if (new Date(seconds * 1000) >= _7days) {
          dataset.push({ time: seconds, status: document.data().status })
        }
      })
      this.setState({ dataset: dataset })
    } catch (error) {
      console.log(error)
    }
  }


  async onCameraShot(image) {
    try {
      let response = await axios.post(credentials.AZURE_URL, this.createBlob(image),
        { headers: { 'Training-Key': credentials.AZURE_TRAINING_KEY, 'Content-Type': 'application/octet-stream' } })

      let status = response.data.predictions[0].tagName
      this.submitNewData(status)
      this.notifications[status].play()
    } catch (error) {
      console.error(error)
    }
  }

  createBlob(dataURL) {
    let BASE64_MARKER = ';base64,'
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
      let parts = dataURL.split(',')
      let contentType = parts[0].split(':')[1]
      let raw = decodeURIComponent(parts[1])
      return new Blob([raw], { type: contentType })
    }
    let parts = dataURL.split(BASE64_MARKER)
    let contentType = parts[0].split(':')[1]
    let raw = window.atob(parts[1])
    let rawLength = raw.length

    let uInt8Array = new Uint8Array(rawLength)

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i)
    }

    return new Blob([uInt8Array], { type: contentType })
  }

  onStartStopClick() {
    this.setState({ isTracking: !this.state.isTracking })
  }

}

export default Index
