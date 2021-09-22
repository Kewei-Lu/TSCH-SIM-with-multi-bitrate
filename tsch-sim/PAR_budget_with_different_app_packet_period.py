import random
import os
times = [600,1200,1800]
loops = 10
duration = [5704,10716,29380,156900]
for loop in range(loops):
    rand = random.randint(1,1024000)
    os.system("sed -i '    98c   SIMULATION_SEED: {},' ./source/config.mjs".format(rand))
    for time in times:
        os.system("sed -i '    95c   SIMULATION_DURATION_SEC: {},' ./source/config.mjs".format(time))
        for d in duration:
            os.system("sed -i '    281c  MAC_SLOT_DURATION_US: {},' ./source/config.mjs".format(d))
            #print('''sed -i"   277c RESULTS_DIR: './results/energy_consumption_with_time/energy-with-time-{}s-{}-{}'," ./source/config.mjs '''.format(time,d,loop))
            os.system('''sed -i "    277c RESULTS_DIR: './results/energy_consumption_with_time/energy-with-time-{}s-{}-{}'," ./source/config.mjs'''.format(d,time,loop))
            os.system("./tsch-sim.sh examples/mesh/config.json")
