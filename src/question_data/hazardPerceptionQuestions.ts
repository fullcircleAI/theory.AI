import type { Question } from '../types';

export const hazardPerceptionQuestions: Question[] = [
  {
    id: 'q-hp-1',
    text: 'According to Dutch traffic rules, your speed is 50 km/h in a built-up area. A child on a scooter suddenly emerges from behind the parked car on the right. What do you do?',
    options: [
      { id: 'q-hp-1o1', text: 'Brake immediately' },
      { id: 'q-hp-1o2', text: 'Release Accelerator' },
      { id: 'q-hp-1o3', text: 'Do Nothing' },
    ],
    correctAnswerId: 'q-hp-1o1',
    explanation: 'Dutch traffic law requires immediate braking when a child has suddenly appeared in your path, creating a high-risk situation that demands immediate action.',
    subject: 'Hazard Perception',
  },
  {
    id: 'q-hp-2',
    text: 'According to Dutch traffic rules, your speed is 30 km/h in a residential area. A pedestrian looking at their phone steps off the pavement from between parked cars. What do you do?',
    options: [
      { id: 'q-hp-2o1', text: 'Brake immediately' },
      { id: 'q-hp-2o2', text: 'Release Accelerator' },
      { id: 'q-hp-2o3', text: 'Do Nothing' },
    ],
    correctAnswerId: 'q-hp-2o1',
    explanation: 'Dutch traffic law requires immediate braking when a pedestrian has unexpectedly entered the roadway without looking, posing an immediate collision risk.',
    subject: 'Hazard Perception',
  },
  {
    id: 'q-hp-3',
    text: 'Your speed is 80 km/h on a country road. A deer suddenly jumps out from bushes on the side, about 50 meters ahead. No oncoming traffic is visible. What do you do?',
    options: [
      { id: 'q-hp-3o1', text: 'Brake' },
      { id: 'q-hp-3o2', text: 'Release Accelerator' },
      { id: 'q-hp-3o3', text: 'Do Nothing' },
    ],
    correctAnswerId: 'q-hp-3o1',
    explanation: 'A deer at 50 meters at 80 km/h is an immediate hazard requiring emergency braking to avoid a collision.',
    subject: 'Hazard Perception',
  },
  {
    id: 'q-hp-4',
    text: 'Your speed is 50 km/h approaching a T-junction on your right. A car is at the give-way line, partially obscured by a hedge. Its front wheels start to turn slightly as if to pull out. What do you do?',
    options: [
      { id: 'q-hp-4o1', text: 'Brake' },
      { id: 'q-hp-4o2', text: 'Release Accelerator' },
      { id: 'q-hp-4o3', text: 'Do Nothing' },
    ],
    correctAnswerId: 'q-hp-4o2',
    explanation: 'Releasing the accelerator allows you to assess if the car will fully emerge and prepares you to brake if necessary, without overreacting if it waits.',
    subject: 'Hazard Perception',
  },
  {
    id: 'q-hp-5',
    text: 'Your speed is 100 km/h in the middle lane of a three-lane motorway. The car ahead of you, without indicating, suddenly swerves into your lane to avoid a much slower vehicle in its original lane. What do you do?',
    options: [
      { id: 'q-hp-5o1', text: 'Brake' },
      { id: 'q-hp-5o2', text: 'Release Accelerator' },
      { id: 'q-hp-5o3', text: 'Do Nothing' },
    ],
    correctAnswerId: 'q-hp-5o1',
    explanation: 'A vehicle suddenly swerving into your lane at high speed requires immediate braking to avoid a collision and maintain a safe following distance.',
    subject: 'Hazard Perception',
  },
  {
    id: 'q-hp-6',
    text: 'Your speed is 30 km/h in a residential area. Children are playing football on a grass verge. A ball rolls onto the road just ahead, and a child starts to run towards it. What do you do?',
    options: [
      { id: 'q-hp-6o1', text: 'Brake' },
      { id: 'q-hp-6o2', text: 'Release Accelerator' },
      { id: 'q-hp-6o3', text: 'Do Nothing' },
    ],
    correctAnswerId: 'q-hp-6o1',
    explanation: 'A child running after a ball into the road is a high-risk situation requiring immediate braking to prevent hitting the child.',
    subject: 'Hazard Perception',
  },
  {
    id: 'q-hp-7',
    text: 'Your speed is 60 km/h approaching a slight bend to the left on a two-lane road. An oncoming vehicle appears to be drifting slightly towards the centerline as it negotiates the bend. What do you do?',
    options: [
      { id: 'q-hp-7o1', text: 'Brake' },
      { id: 'q-hp-7o2', text: 'Release Accelerator' },
      { id: 'q-hp-7o3', text: 'Do Nothing' },
    ],
    correctAnswerId: 'q-hp-7o2',
    explanation: 'Releasing the accelerator provides more space and time to react if the oncoming vehicle crosses the centerline. It is a cautious approach to a potential hazard.',
    subject: 'Hazard Perception',
  },
  {
    id: 'q-hp-8',
    text: 'Your speed is 70 km/h on a main road approaching traffic lights about 150 meters ahead. They are currently green but suddenly change to amber. What do you do?',
    options: [
      { id: 'q-hp-8o1', text: 'Brake' },
      { id: 'q-hp-8o2', text: 'Release Accelerator' },
      { id: 'q-hp-8o3', text: 'Do Nothing' },
    ],
    correctAnswerId: 'q-hp-8o2',
    explanation: 'Releasing the accelerator is the initial action to assess if a safe stop can be made before the stop line. If too close to stop safely, you might proceed through amber, but the primary action is to prepare to stop.',
    subject: 'Hazard Perception',
  },
  {
    id: 'q-hp-9',
    text: 'Your speed is 10 km/h in very slow-moving/queuing traffic. A motorcyclist is filtering between your lane and the lane to your right, approaching from behind. The gap is tight. What do you do?',
    options: [
      { id: 'q-hp-9o1', text: 'Brake' },
      { id: 'q-hp-9o2', text: 'Release Accelerator' },
      { id: 'q-hp-9o3', text: 'Do Nothing' },
    ],
    correctAnswerId: 'q-hp-9o3',
    explanation: 'In very slow or stationary traffic, maintain your position and speed (or lack thereof). Sudden braking or swerving can be dangerous for the filtering motorcyclist. Allow them to pass.',
    subject: 'Hazard Perception',
  },
  {
    id: 'q-hp-10',
    text: 'Your speed is 50 km/h driving towards a junction where you intend to turn right. The sun is very low, causing significant glare and making it very difficult to see if any vehicles are emerging from the side road. What do you do?',
    options: [
      { id: 'q-hp-10o1', text: 'Brake' },
      { id: 'q-hp-10o2', text: 'Release Accelerator' },
      { id: 'q-hp-10o3', text: 'Do Nothing' },
    ],
    correctAnswerId: 'q-hp-10o2',
    explanation: 'Severe glare significantly reduces visibility. Release the accelerator to slow down considerably and be prepared to brake or stop if needed as you cannot clearly see potential hazards at the junction.',
    subject: 'Hazard Perception',
  }
]; 