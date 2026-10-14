export interface DMVQuestion {
  id: string;
  question: string;
  imageIcon: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const DMV_QUESTIONS: DMVQuestion[] = [
  {
    id: 'dmv_1',
    question: 'What does a red octagonal sign with the letters S-T-O-P indicate?',
    imageIcon: '🛑',
    options: [
      'Slow down and yield to oncoming traffic',
      'Come to a complete stop before the stop line or crosswalk',
      'Speed up to beat oncoming traffic',
      'Honk your horn twice and proceed'
    ],
    correctIndex: 1,
    explanation: 'A stop sign requires you to come to a complete halt before the limit line.'
  },
  {
    id: 'dmv_2',
    question: 'When approaching a flashing yellow traffic signal light, what should you do?',
    imageIcon: '🟡',
    options: [
      'Stop completely and wait for green',
      'Accelerate immediately before it turns red',
      'Slow down and proceed with caution',
      'Turn on your hazard blinkers and reverse'
    ],
    correctIndex: 2,
    explanation: 'A flashing yellow light warns drivers to proceed with caution.'
  },
  {
    id: 'dmv_3',
    question: 'What does a triangular sign with an inverted apex (pointing down) mean?',
    imageIcon: '🔻',
    options: [
      'Yield the right of way to other road users',
      'Steep downgrade hill ahead',
      'No passing zone',
      'Construction zone ahead'
    ],
    correctIndex: 0,
    explanation: 'An inverted triangle is the universal Yield sign.'
  },
  {
    id: 'dmv_4',
    question: 'When an emergency vehicle with flashing lights and sirens approaches from behind, you must:',
    imageIcon: '🚑',
    options: [
      'Speed up to clear the way',
      'Pull over to the right edge of the curb and stop',
      'Stop in the middle of your lane immediately',
      'Flash your high beams'
    ],
    correctIndex: 1,
    explanation: 'You must safely steer right and come to a complete stop until it passes.'
  },
  {
    id: 'dmv_5',
    question: 'What is the safe following distance under normal driving conditions?',
    imageIcon: '🚗',
    options: [
      '1 car length regardless of speed',
      '3 to 4 seconds following distance',
      '10 feet bumper to bumper',
      'As close as possible to draft fuel'
    ],
    correctIndex: 1,
    explanation: 'The 3-second rule gives adequate reaction time.'
  },
  {
    id: 'dmv_6',
    question: 'What does a sign showing two curved swerving tire marks behind a car represent?',
    imageIcon: '⚠️',
    options: [
      'Car wash ahead',
      'Slippery when wet road surface',
      'Drifting competition track',
      'Rough gravel road'
    ],
    correctIndex: 1,
    explanation: 'This sign warns that the pavement is slick when wet.'
  }
];
