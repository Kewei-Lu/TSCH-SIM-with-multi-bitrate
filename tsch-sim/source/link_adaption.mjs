import * as utils from './utils.mjs';
import * as log from './log.mjs';
import { heap_insert, heap_extract_min, heap_remove_at } from './heap.mjs';
import * as Timeslot_switcher from './change_slot_duration.mjs';
import config from './config.mjs';
import * as sim from './simulator.mjs';
import status from './status.mjs';
import * as time from './time.mjs';

/* For simplicity, in simulator the scanner will only check the current app_packet period through config.
   Assuming all nodes in the network work under identical bitrate for one particular time.
   2 different modes:
       throughput/energy saving mode: for nodes with fixed position, when the network PDR reaches a threshold the bitrate will be raised/lowerd (currently only raised)
       link quality mode: for mobility node, set a threshold and when the link quality(path loss) reaches the bitrate will be lowered for better quality.
*/
export class LA_scanner_link_mode{
    constructor(turnover_period,update_resolution,network){
        this.turnover_period = turnover_period;  // turnover period within which the scanner will not change bitrate again
        this.update_resolution = update_resolution;  // how frequent the scanner will check the stats
        this.last_update = 0;  // set the last time for updating
        this.network = network;  // get the network info
        this.bitrate = time.timeline.timeslot_switcher.current_bitrate;  // current bitrate
    }
    
    // if the scanner is in turnover period
    sleep(){
        log.log(log.DEBUG,null,"LA scanner",`the scanner is sleeping`);
    }

    // check the stats right now in the network
    check_stats(){
        

    }

}
