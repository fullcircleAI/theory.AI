import type { Question } from '../types';

export const trafficLightsSignalsQuestions: Question[] = [
  {
    id: 'q-tls-1',
    text: 'According to Dutch traffic rules, you are approaching traffic lights that have just changed to amber (yellow). What is the general rule you should follow?',
    options: [
      { id: 'q-tls-1o1', text: 'Accelerate to pass through before it turns red.' },
      { id: 'q-tls-1o2', text: 'Stop before the stop line, unless you are so close that to stop safely would cause an accident.' },
      { id: 'q-tls-1o3', text: 'Continue at the same speed as it means the lights are about to turn green.' },
    ],
    correctAnswerId: 'q-tls-1o2',
    explanation: 'Dutch traffic law states that amber means stop unless you\'ve already crossed the stop line or are so close that stopping suddenly might cause a collision.',
    subject: 'Traffic Lights & Signals',
  },
  {
    id: 'q-tls-2',
    text: 'According to Dutch traffic rules, what does a green filter arrow (e.g., for turning left) at traffic lights indicate when the main light is red?',
    options: [
      { id: 'q-tls-2o1', text: 'You may turn left if the way is clear, but give way to pedestrians crossing.' },
      { id: 'q-tls-2o2', text: 'You must wait for the main green light before turning left.' },
      { id: 'q-tls-2o3', text: 'You have priority over all other traffic and pedestrians when turning left.' },
    ],
    correctAnswerId: 'q-tls-2o1',
    explanation: 'In the Netherlands, a green filter arrow allows you to proceed in the direction of the arrow, even if the main light is red, provided you give way to any pedestrians or other road users who have priority.',
    subject: 'Traffic Lights & Signals',
  },
  {
    id: 'q-tls-3',
    text: 'If traffic lights are out of order (not working at all), how should you treat the junction?',
    options: [
      { id: 'q-tls-3o1', text: 'Treat it as if you have priority over all traffic.' },
      { id: 'q-tls-3o2', text: 'Proceed with extreme caution and treat the junction as an unmarked crossroads or give way, depending on road markings or signs.' },
      { id: 'q-tls-3o3', text: 'Wait for a police officer to direct traffic before proceeding.' },
    ],
    correctAnswerId: 'q-tls-3o2',
    explanation: 'When traffic lights are out of order, revert to standard priority rules as if the junction is unmarked, or follow any existing give way/stop signs. Always proceed with caution.',
    subject: 'Traffic Lights & Signals',
  },
  {
    id: 'q-tls-4',
    text: 'What does a flashing amber beacon mounted above a pedestrian crossing (Pelican or Puffin crossing) signify when pedestrians are crossing?',
    options: [
      { id: 'q-tls-4o1', text: 'You must stop and wait until the beacon stops flashing.' },
      { id: 'q-tls-4o2', text: 'You may proceed if the way is clear, giving way to pedestrians still on the crossing.' },
      { id: 'q-tls-4o3', text: 'The crossing is out of order; proceed normally.' },
    ],
    correctAnswerId: 'q-tls-4o2',
    explanation: 'A flashing amber beacon at a pedestrian crossing means you must give way to pedestrians on the crossing, but you may proceed if the crossing is clear.',
    subject: 'Traffic Lights & Signals',
  },
  {
    id: 'q-tls-5',
    text: 'A police officer is directing traffic at a junction and signals you to stop, but the traffic light for you is green. What must you do?',
    options: [
      { id: 'q-tls-5o1', text: 'Obey the green traffic light and proceed.' },
      { id: 'q-tls-5o2', text: 'Point to the green light to inform the officer and then proceed.' },
      { id: 'q-tls-5o3', text: 'Obey the police officer\'s signal and stop.' },
    ],
    correctAnswerId: 'q-tls-5o3',
    explanation: 'Signals given by a police officer directing traffic override all other traffic signals and signs. You must obey the officer.',
    subject: 'Traffic Lights & Signals',
  },
  {
    id: 'q-tls-6',
    text: 'At a level crossing, twin flashing red lights have started to flash. What is your immediate action?',
    options: [
      { id: 'q-tls-6o1', text: 'Stop immediately, even if you are already on the crossing.' },
      { id: 'q-tls-6o2', text: 'Stop before the barrier or stop line and wait until the lights stop flashing and any barrier is fully raised.' },
      { id: 'q-tls-6o3', text: 'Cross quickly if you cannot see or hear a train approaching.' },
    ],
    correctAnswerId: 'q-tls-6o2',
    explanation: 'Twin flashing red lights at a level crossing mean a train is approaching. You must stop before the stop line or barrier and wait.',
    subject: 'Traffic Lights & Signals',
  },
  {
    id: 'q-tls-7',
    text: 'Some traffic lights have a white light signal for trams or buses. What does a steady white horizontal bar mean for these vehicles?',
    options: [
      { id: 'q-tls-7o1', text: 'Proceed with caution.' },
      { id: 'q-tls-7o2', text: 'Prepare to stop.' },
      { id: 'q-tls-7o3', text: 'Stop.' },
    ],
    correctAnswerId: 'q-tls-7o3',
    explanation: 'For trams or buses, a steady white horizontal bar at a traffic light signal typically means "Stop".',
    subject: 'Traffic Lights & Signals',
  },
  {
    id: 'q-tls-8',
    text: 'You see a signal light showing a red bicycle symbol. What does this mean for cyclists?',
    options: [
      { id: 'q-tls-8o1', text: 'Cyclists must dismount and walk.' },
      { id: 'q-tls-8o2', text: 'Cyclists must stop and wait for a green bicycle signal.' },
      { id: 'q-tls-8o3', text: 'Cyclists can proceed if no other traffic is present.' },
    ],
    correctAnswerId: 'q-tls-8o2',
    explanation: 'A red bicycle symbol at traffic lights means cyclists must stop and wait for the green signal specific to them or a general green light.',
    subject: 'Traffic Lights & Signals',
  },
  {
    id: 'q-tls-9',
    text: 'What is an "intelligent" or "adaptive" traffic light system designed to do?',
    options: [
      { id: 'q-tls-9o1', text: 'Change lights at fixed intervals regardless of traffic.' },
      { id: 'q-tls-9o2', text: 'Prioritize buses and emergency vehicles by giving them immediate green lights.' },
      { id: 'q-tls-9o3', text: 'Adjust light timings based on real-time traffic flow detected by sensors.' },
    ],
    correctAnswerId: 'q-tls-9o3',
    explanation: 'Adaptive traffic light systems use sensors to detect traffic volume and adjust signal timings to optimize flow and reduce delays.',
    subject: 'Traffic Lights & Signals',
  },
  {
    id: 'q-tls-10',
    text: 'If a traffic light shows red and amber together, what should you prepare to do?',
    options: [
      { id: 'q-tls-10o1', text: 'Stop, as the lights are about to turn red.' },
      { id: 'q-tls-10o2', text: 'Proceed with caution, as the lights are faulty.' },
      { id: 'q-tls-10o3', text: 'Prepare to go; the lights will shortly change to green.' },
    ],
    correctAnswerId: 'q-tls-10o3',
    explanation: 'Red and amber lights showing together indicate that the lights are about to change to green. You should prepare to proceed when it turns green.',
    subject: 'Traffic Lights & Signals',
  },
]; 