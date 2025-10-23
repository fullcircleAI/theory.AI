import type { Question } from '../types';

export const roundaboutRulesQuestions: Question[] = [
  {
    id: 'q-rr-1',
    text: 'According to Dutch traffic rules, you are approaching a roundabout. What should you do before entering?',
    options: [
      { id: 'q-rr-1o1', text: 'Give way to traffic already in the roundabout' },
      { id: 'q-rr-1o2', text: 'Enter immediately if no cars are visible' },
      { id: 'q-rr-1o3', text: 'Stop completely before entering' }
    ],
    correctAnswerId: 'q-rr-1o1',
    explanation: 'Dutch traffic law requires you to give way to traffic already in the roundabout, including cyclists and pedestrians, before entering.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-2',
    text: 'According to Dutch traffic rules, you are in a roundabout and want to exit. What should you do?',
    options: [
      { id: 'q-rr-2o1', text: 'Signal right before exiting' },
      { id: 'q-rr-2o2', text: 'Signal left before exiting' },
      { id: 'q-rr-2o3', text: 'No need to signal when exiting' }
    ],
    correctAnswerId: 'q-rr-2o1',
    explanation: 'Dutch traffic law requires you to signal right when exiting a roundabout to indicate your intention to leave.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-3',
    text: 'You are approaching a roundabout and want to turn left. Which lane should you use?',
    options: [
      { id: 'q-rr-3o1', text: 'Left lane' },
      { id: 'q-rr-3o2', text: 'Right lane' },
      { id: 'q-rr-3o3', text: 'Either lane is acceptable' }
    ],
    correctAnswerId: 'q-rr-3o1',
    explanation: 'When turning left at a roundabout, use the left lane to enter and stay in the left lane while in the roundabout.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-4',
    text: 'You are approaching a roundabout and want to go straight ahead. Which lane should you use?',
    options: [
      { id: 'q-rr-4o1', text: 'Left lane' },
      { id: 'q-rr-4o2', text: 'Right lane' },
      { id: 'q-rr-4o3', text: 'Either lane is acceptable' }
    ],
    correctAnswerId: 'q-rr-4o3',
    explanation: 'When going straight ahead at a roundabout, you can use either lane unless road markings indicate otherwise.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-5',
    text: 'You are approaching a roundabout and want to turn right. Which lane should you use?',
    options: [
      { id: 'q-rr-5o1', text: 'Left lane' },
      { id: 'q-rr-5o2', text: 'Right lane' },
      { id: 'q-rr-5o3', text: 'Either lane is acceptable' }
    ],
    correctAnswerId: 'q-rr-5o2',
    explanation: 'When turning right at a roundabout, use the right lane to enter and stay in the right lane while in the roundabout.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-6',
    text: 'You are in a roundabout and want to change lanes. What should you do?',
    options: [
      { id: 'q-rr-6o1', text: 'Signal and change lanes when safe' },
      { id: 'q-rr-6o2', text: 'Change lanes immediately' },
      { id: 'q-rr-6o3', text: 'Never change lanes in a roundabout' }
    ],
    correctAnswerId: 'q-rr-6o1',
    explanation: 'You can change lanes in a roundabout, but you must signal your intention and only change when it is safe to do so.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-7',
    text: 'You are approaching a roundabout and see a cyclist already in the roundabout. What should you do?',
    options: [
      { id: 'q-rr-7o1', text: 'Give way to the cyclist' },
      { id: 'q-rr-7o2', text: 'Enter the roundabout, cyclists must give way' },
      { id: 'q-rr-7o3', text: 'Honk to warn the cyclist' }
    ],
    correctAnswerId: 'q-rr-7o1',
    explanation: 'Cyclists in a roundabout have the same rights as other vehicles. You must give way to them before entering.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-8',
    text: 'You are in a roundabout and see a pedestrian waiting to cross at an exit. What should you do?',
    options: [
      { id: 'q-rr-8o1', text: 'Give way to the pedestrian' },
      { id: 'q-rr-8o2', text: 'Continue driving, pedestrians must wait' },
      { id: 'q-rr-8o3', text: 'Honk to warn the pedestrian' }
    ],
    correctAnswerId: 'q-rr-8o1',
    explanation: 'When exiting a roundabout, you must give way to pedestrians who are waiting to cross or already crossing.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-9',
    text: 'You are approaching a roundabout and see an emergency vehicle with flashing lights. What should you do?',
    options: [
      { id: 'q-rr-9o1', text: 'Give way to the emergency vehicle' },
      { id: 'q-rr-9o2', text: 'Enter the roundabout normally' },
      { id: 'q-rr-9o3', text: 'Stop completely before the roundabout' }
    ],
    correctAnswerId: 'q-rr-9o1',
    explanation: 'Emergency vehicles with flashing lights have priority. Give way to them before entering the roundabout.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-10',
    text: 'You are in a roundabout and want to make a U-turn. What should you do?',
    options: [
      { id: 'q-rr-10o1', text: 'Signal right and exit at the next exit' },
      { id: 'q-rr-10o2', text: 'Signal left and continue around' },
      { id: 'q-rr-10o3', text: 'U-turns are not allowed in roundabouts' }
    ],
    correctAnswerId: 'q-rr-10o2',
    explanation: 'To make a U-turn in a roundabout, signal left and continue around the roundabout to exit at the same road you entered from.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-11',
    text: 'You are approaching a roundabout and see a large truck already in the roundabout. What should you do?',
    options: [
      { id: 'q-rr-11o1', text: 'Give way to the truck' },
      { id: 'q-rr-11o2', text: 'Enter the roundabout, trucks must give way' },
      { id: 'q-rr-11o3', text: 'Honk to warn the truck driver' }
    ],
    correctAnswerId: 'q-rr-11o1',
    explanation: 'Large trucks in a roundabout have the same rights as other vehicles. You must give way to them before entering.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-12',
    text: 'You are in a roundabout and see a car trying to enter from your right. What should you do?',
    options: [
      { id: 'q-rr-12o1', text: 'Give way to the entering car' },
      { id: 'q-rr-12o2', text: 'Continue driving, you have priority' },
      { id: 'q-rr-12o3', text: 'Honk to warn the entering car' }
    ],
    correctAnswerId: 'q-rr-12o2',
    explanation: 'Once you are in a roundabout, you have priority over vehicles trying to enter. The entering vehicle must give way to you.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-13',
    text: 'You are approaching a roundabout and see a bus already in the roundabout. What should you do?',
    options: [
      { id: 'q-rr-13o1', text: 'Give way to the bus' },
      { id: 'q-rr-13o2', text: 'Enter the roundabout, buses must give way' },
      { id: 'q-rr-13o3', text: 'Honk to warn the bus driver' }
    ],
    correctAnswerId: 'q-rr-13o1',
    explanation: 'Buses in a roundabout have the same rights as other vehicles. You must give way to them before entering.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-14',
    text: 'You are in a roundabout and want to exit but see a cyclist in the exit lane. What should you do?',
    options: [
      { id: 'q-rr-14o1', text: 'Give way to the cyclist' },
      { id: 'q-rr-14o2', text: 'Exit normally, cyclists must give way' },
      { id: 'q-rr-14o3', text: 'Honk to warn the cyclist' }
    ],
    correctAnswerId: 'q-rr-14o1',
    explanation: 'When exiting a roundabout, you must give way to cyclists who are already in the exit lane.',
    subject: 'Roundabout Rules'
  },
  {
    id: 'q-rr-15',
    text: 'You are approaching a roundabout and see a motorcycle already in the roundabout. What should you do?',
    options: [
      { id: 'q-rr-15o1', text: 'Give way to the motorcycle' },
      { id: 'q-rr-15o2', text: 'Enter the roundabout, motorcycles must give way' },
      { id: 'q-rr-15o3', text: 'Honk to warn the motorcyclist' }
    ],
    correctAnswerId: 'q-rr-15o1',
    explanation: 'Motorcycles in a roundabout have the same rights as other vehicles. You must give way to them before entering.',
    subject: 'Roundabout Rules'
  }
];






