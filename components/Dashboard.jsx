import { Typography, Button } from 'antd'
import PieChart from './PieChart'
import WeekChart from './WeekChart'
import Webcam from 'react-webcam'

const { Title } = Typography

const videoConstraints = {
  width: 1080,
  height: 720,
  facingMode: 'user'
}

class Dashboard extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    let weekData = [{ name: 'Not Good Posture' }, { name: 'Good Posture' }]
    for (let i = 6; i >= 0; i--) {
      weekData[0][i.toString()] = 0
      weekData[1][i.toString()] = 0
    }

    let today = new Date()
    let date, diffTime, diffDays

    for (let i in this.props.dataset) {
      switch (this.props.dataset[i].status) {
        case 'good':
          date = new Date(this.props.dataset[i].time * 1000)
          diffTime = Math.abs(today.getTime() - date.getTime())
          diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          weekData[1][diffDays - 1]++;
          break
        default:
          date = new Date(this.props.dataset[i].time * 1000)
          diffTime = Math.abs(today.getTime() - date.getTime())
          diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          weekData[0][diffDays - 1]++;
      }
    }

    let last24h = []
    let last48h = []
    this.props.postures.forEach((posture, index) => {
      last24h.push({ posture: this.props.postureLabels[index], times: 0 })
      last48h.push({ posture: this.props.postureLabels[index], times: 0 })
    })

    for (let datapoint of this.props.dataset) {
      let date = new Date(datapoint.time * 1000)
      let dayBeforeToday = new Date()
      dayBeforeToday.setDate(dayBeforeToday.getDate() - 1)
      let dayBeforeYesterday = new Date(dayBeforeToday)
      dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1)

      console.log(date, dayBeforeToday, dayBeforeYesterday)

      if (date >= dayBeforeToday) {
        last24h[this.props.postures.indexOf(datapoint.status)].times += 1
      } else if (date >= dayBeforeYesterday) {
        last48h[this.props.postures.indexOf(datapoint.status)].times += 1
      }
    }
    console.log(last24h)
    console.log(last48h)

    if (!process.browser) {
      return <React.Fragment></React.Fragment>
    }
    return (
      <React.Fragment>
        <div className='dashboard-start-stop'>
          <Webcam
            style={{ borderRadius: 10 }}
            audio={false}
            ref={this.webcamRef}
            screenshotFormat="image/jpeg"
            width={300}
            videoConstraints={videoConstraints} />

        </div>
        <div className='dashboard-start-stop'>
          <Button onClick={() => this.props.onStartStopClick()} type={!this.props.isTracking ? 'primary' : 'danger'} size='large' shape='round' icon={!this.props.isTracking ? 'play-circle' : 'pause'}>
            {!this.props.isTracking ? 'Start Tracking' : 'Stop Tracking'}
          </Button>
        </div>
        <div className='dashboard-pie-charts'>
          <div className='dashboard-pie-title'>
            <Title style={{ paddingRight: '26px' }} level={2}>Today </Title>
            <PieChart data={last24h}></PieChart>
          </div>
          <div className='dashboard-pie-title'>
            <Title style={{ paddingRight: '26px' }} level={2}>Yesterday </Title>
            <PieChart data={last48h}></PieChart>
          </div>
        </div>
        <div className='dashboard-pie-title-single'>
          <Title style={{ paddingRight: '26px' }} level={2}>Last Week </Title>
          <WeekChart data={weekData}></WeekChart>
        </div>
      </React.Fragment>
    )
  }
}

export default Dashboard