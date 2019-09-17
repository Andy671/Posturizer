import Webcam from 'react-webcam'

const videoConstraints = {
  width: 1080,
  height: 720,
  facingMode: 'user'
}

class InvisibleCamera extends React.Component {
  constructor(props) {
    super(props)
    this.webcamRef = React.createRef()
  }

  componentDidMount() {
    window.setInterval(() => {
      if (this.props.isTracking && this.props.isUserLoggedIn) {
        const imageSrc = this.webcamRef.current.getScreenshot()
        this.props.onCameraShot(imageSrc)
      }
    }, this.props.cameraShotIntervalMillis)
  }

  render() {
    return (
      <React.Fragment>
        <Webcam
          style={{ position: 'absolute', left: 0, top: 0, opacity: 0 }}
          audio={false}
          height={720}
          ref={this.webcamRef}
          screenshotFormat="image/jpeg"
          width={1080}
          videoConstraints={videoConstraints} />
      </React.Fragment>
    )
  }
}

export default InvisibleCamera
