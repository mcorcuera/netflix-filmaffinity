// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'
import { log } from './logger';
import { FaNetflixDecorator } from './filmaffinity';
import { NetflixDecoratorManager } from './netflix';
import { nlToArr } from './utils';

const videoArtWorks = document.querySelectorAll('.video-artwork');

const manager = new NetflixDecoratorManager();
const faDecorator = new FaNetflixDecorator();

manager.start();



manager.registerCardDecorator(faDecorator);
