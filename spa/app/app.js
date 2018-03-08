/**
 * app.js
 *
 * This is the entry file for the application, only setup and boilerplate
 * code.
 */

// Needed for redux-saga es6 generator support
import 'babel-polyfill';

// Import all the third party stuff
import ReactDOM from 'react-dom';


import {Answers} from './components/Answers';

// Create redux store with history
const MOUNT_NODE = document.getElementById('app');

const render = () => {
  ReactDOM.render(
    <Answers/>,
    MOUNT_NODE
  );
};

if (module.hot) {
  module.hot.accept(['./i18n', 'containers/App'], () => {
    ReactDOM.unmountComponentAtNode(MOUNT_NODE);
    render();
  });
}
render();
