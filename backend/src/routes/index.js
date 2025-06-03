import buildings from './buildings.js';
import building from './building.js';
import rooms from './rooms.js';
import room from './room.js';
import sensors from './sensors.js';
import measurements from './measurements.js';

export default (app) => {
    app.use('/buildings', buildings);
    app.use('/building', building);
    app.use('/rooms', rooms);
    app.use('/room', room);
    app.use('/sensors', sensors);
    app.use('/measurements', measurements);
};