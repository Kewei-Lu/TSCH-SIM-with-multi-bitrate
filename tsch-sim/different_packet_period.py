import os
import logging
import itertools
import json
import random

#logging.basicConfig(filename='./pythonlog')
duration_list = [list(x) for x in itertools.combinations([5704,10716,29380,156900,10205000],2)]
#speed = [5704,10716,29380,156900,10205000]
speed = [29380,10716,5704]
#test_list = [[0],[0,300]]
test_list = [[0,30000]]
app_gen = [i for i in range(1,61,1)]
loop = 1
time = 7200 # simulation duration in second
#os.system("sed -i '    95c   SIMULATION_DURATION_SEC: {},' ./source/config2.mjs".format(time))

for j in app_gen:
    app_gen_time = j
    os.system(r'''sed -i '    15c   "APP_PACKETS": {{"APP_PACKET_PERIOD_SEC": {}, "TO_ID": 1}}' ./examples/mesh/config2.json'''.format(app_gen_time))  
    for l in range(loop):
        rand = random.randint(1,1024000)
        os.system("sed -i '    98c   SIMULATION_SEED: {},' ./source/config.mjs".format(rand))
        for i in range(len(speed)):
            os.system("sed -i '    281c   MAC_SLOT_DURATION_US: {},' ./source/config.mjs".format(speed[i]))
            os.system("sed -i '    287c  BITRATE_LEVEL : {},' ./source/config.mjs".format(i+1))
            os.system('''sed -i "    277c RESULTS_DIR: './results/single_model_diff_packet_period/{}s-{}-{}-{}'," ./source/config.mjs'''.format(time,speed[i],app_gen_time,l))
            os.system("./tsch-sim.sh examples/mesh/config2.json")
#"SIMULATION_SCRIPT_FILE":"./scripts for link adaption/link_adaption_with_throughput_and_level.js",
