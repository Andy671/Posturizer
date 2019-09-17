import DataSet from '@antv/data-set'

let bizcharts
if (process.browser) {
  bizcharts = require('bizcharts')
}
const COLORS = ['#EE637D','#5FCA78']

class WeekChart extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const ds = new DataSet();
    const dv = ds.createView().source(this.props.data);
    dv.transform({
      type: 'fold',
      fields: ['6', '5', '4', '3', '2', '1', '0'],
      key: 'Day',
      value: 'Time'
    });

    if (!process.browser) {
      return <React.Fragment></React.Fragment>
    }
    return (

      <React.Fragment>
        
        <div>
          <bizcharts.Chart height={400} data={dv} forceFit>
            <bizcharts.Axis name='Day' label={{ formatter: val => `${val} day(s) ago` }}/>
            <bizcharts.Axis name='Time' label={{ formatter: val => `${(val/6).toFixed(2)} mins` }}/>
            <bizcharts.Legend />
            <bizcharts.Tooltip
              crosshairs={{
                type: 'y'
              }}
            />
            <bizcharts.Geom
              type='interval'
              position='Day*Time'
              color={['name', COLORS]}
              adjust={[
                {
                  type: 'dodge',
                  marginRatio: 1 / 32
                }
              ]}
            />
          </bizcharts.Chart>
        </div>
      </React.Fragment>
    )
  }
}

export default WeekChart