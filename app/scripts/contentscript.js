// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'
import { FaNetflixDecorator } from './filmaffinity-content';
import { NetflixDecoratorManager } from './netflix';

const videoArtWorks = document.querySelectorAll('.video-artwork');

const manager = new NetflixDecoratorManager();
const faDecorator = new FaNetflixDecorator();

manager.start();



manager.registerCardDecorator(faDecorator);
