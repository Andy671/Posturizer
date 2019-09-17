let bizcharts
if (process.browser) {
  bizcharts = require('bizcharts')
}
const COLORS = ['#5FCA78', '#47A3FB', '#57CAC9', '#F8D455', '#EE637D']

class PieChart extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    return (<bizcharts.Chart
      height={350}
      data={this.props.data}
      padding={[20, 30, 30, 20]}
      forceFit >
      <bizcharts.Coord type='theta' radius={0.8} />
      <bizcharts.Tooltip showTitle={false} />
      <bizcharts.Geom
        style={{
          stroke: '#FFF',
          lineWidth: 1,
        }}
        type='intervalStack'
        position='times'
        color={['posture', COLORS]}
        shape='radiusPie'>
        <bizcharts.Legend
          position="right"
          offsetY={-150}
          offsetX={-100}
        />
      </bizcharts.Geom>
    </bizcharts.Chart>)
  }
}

export default PieChart