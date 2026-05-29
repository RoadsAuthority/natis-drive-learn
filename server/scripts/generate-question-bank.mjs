/**
 * Writes data/question-bank.json with 70 syllabus-style MCQs for NaTIS learner theory.
 * Run: npm run generate:questions
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

const core = [
  {
    question: "What is the speed limit in urban areas in Namibia?",
    options: [
      { id: "a", text: "60 km/h" },
      { id: "b", text: "80 km/h" },
      { id: "c", text: "100 km/h" },
      { id: "d", text: "120 km/h" },
    ],
    correctAnswer: "a",
  },
  {
    question: "When approaching a pedestrian crossing, you must:",
    options: [
      { id: "a", text: "Speed up to cross quickly" },
      { id: "b", text: "Slow down and give way to pedestrians" },
      { id: "c", text: "Honk your horn" },
      { id: "d", text: "Flash your lights" },
    ],
    correctAnswer: "b",
  },
  {
    question: "A red traffic light means:",
    options: [
      { id: "a", text: "Slow down" },
      { id: "b", text: "Proceed with caution" },
      { id: "c", text: "Stop completely" },
      { id: "d", text: "Speed up to clear the intersection" },
    ],
    correctAnswer: "c",
    imageUrl: "/question-images/stop-sign.svg",
  },
  {
    question: "What does a yellow traffic light indicate?",
    options: [
      { id: "a", text: "Stop if safe to do so" },
      { id: "b", text: "Go faster" },
      { id: "c", text: "Turn left" },
      { id: "d", text: "Reverse" },
    ],
    correctAnswer: "a",
    imageUrl: "/question-images/warning-triangle.svg",
  },
  {
    question: "The sign shown below means you must:",
    options: [
      { id: "a", text: "Come to a complete stop" },
      { id: "b", text: "Speed up" },
      { id: "c", text: "Park here" },
      { id: "d", text: "Overtake other vehicles" },
    ],
    correctAnswer: "a",
    imageUrl: "/question-images/stop-sign.svg",
  },
  {
    question: "The triangular sign shown below warns you to:",
    options: [
      { id: "a", text: "Stop immediately" },
      { id: "b", text: "Be cautious — hazard ahead" },
      { id: "c", text: "Turn left only" },
      { id: "d", text: "Increase speed" },
    ],
    correctAnswer: "b",
    imageUrl: "/question-images/warning-triangle.svg",
  },
  {
    question: "The road marking shown below indicates:",
    options: [
      { id: "a", text: "A pedestrian crossing ahead" },
      { id: "b", text: "No parking zone" },
      { id: "c", text: "Motorway entry" },
      { id: "d", text: "One-way street" },
    ],
    correctAnswer: "a",
    imageUrl: "/question-images/pedestrian-crossing.svg",
  },
  {
    question: "When you see the sign below, you should:",
    options: [
      { id: "a", text: "Give way to other traffic" },
      { id: "b", text: "Stop completely" },
      { id: "c", text: "Ignore it if the road is clear" },
      { id: "d", text: "Reverse" },
    ],
    correctAnswer: "a",
    imageUrl: "/question-images/yield-sign.svg",
  },
  {
    question: "The minimum following distance in good conditions should be:",
    options: [
      { id: "a", text: "1 second" },
      { id: "b", text: "2 seconds" },
      { id: "c", text: "3 seconds" },
      { id: "d", text: "5 seconds" },
    ],
    correctAnswer: "c",
  },
  {
    question: "You must not park within how many metres of a fire hydrant?",
    options: [
      { id: "a", text: "3 metres" },
      { id: "b", text: "5 metres" },
      { id: "c", text: "10 metres" },
      { id: "d", text: "15 metres" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When driving in rain, you should:",
    options: [
      { id: "a", text: "Drive faster to get home quickly" },
      { id: "b", text: "Use cruise control" },
      { id: "c", text: "Reduce speed and increase following distance" },
      { id: "d", text: "Turn off headlights" },
    ],
    correctAnswer: "c",
  },
  {
    question: "A solid white line on the road means:",
    options: [
      { id: "a", text: "You may overtake" },
      { id: "b", text: "No overtaking allowed" },
      { id: "c", text: "Parking is allowed" },
      { id: "d", text: "Speed up" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Parking on a road in an urban area is not allowed within:",
    options: [
      { id: "a", text: "12 m of a pedestrian crossing" },
      { id: "b", text: "1.2 m of a pedestrian crossing" },
      { id: "c", text: "9 m of a pedestrian crossing" },
      { id: "d", text: "9.2 m of a pedestrian crossing" },
    ],
    correctAnswer: "c",
  },
  {
    question: "At a four-way stop, who has the right of way?",
    options: [
      { id: "a", text: "The vehicle that arrives first" },
      { id: "b", text: "The largest vehicle" },
      { id: "c", text: "The vehicle on the right" },
      { id: "d", text: "The vehicle going straight" },
    ],
    correctAnswer: "a",
  },
];

const scenarioBank = [
  {
    question: "You are turning right at an intersection. A pedestrian is crossing the road you want to enter. You must:",
    options: [
      { id: "a", text: "Sound your horn and proceed" },
      { id: "b", text: "Wait until the pedestrian has crossed safely" },
      { id: "c", text: "Drive around the pedestrian" },
      { id: "d", text: "Flash your lights and continue" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When overtaking a cyclist, you should leave at least:",
    options: [
      { id: "a", text: "No extra space if the road is wide" },
      { id: "b", text: "A safe lateral gap and only when it is legal and safe" },
      { id: "c", text: "1 metre only at night" },
      { id: "d", text: "Enough room to share the same lane" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Headlights must be used:",
    options: [
      { id: "a", text: "Only on highways" },
      { id: "b", text: "From sunset to sunrise and when visibility is poor" },
      { id: "c", text: "Only in rain" },
      { id: "d", text: "Only when other drivers flash you" },
    ],
    correctAnswer: "b",
  },
  {
    question: "A green traffic light means you may proceed:",
    options: [
      { id: "a", text: "Without checking the intersection" },
      { id: "b", text: "Only if the way is clear and it is safe to do so" },
      { id: "c", text: "At any speed" },
      { id: "d", text: "Even if pedestrians are still crossing against their signal" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When a school patrol officer shows a stop sign, you must:",
    options: [
      { id: "a", text: "Slow down and drive past carefully" },
      { id: "b", text: "Stop completely until told it is safe to proceed" },
      { id: "c", text: "Honk to warn children" },
      { id: "d", text: "Change lanes quickly" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Driving under the influence of alcohol:",
    options: [
      { id: "a", text: "Is acceptable on quiet roads" },
      { id: "b", text: "Is illegal and seriously increases crash risk" },
      { id: "c", text: "Helps you stay alert on long trips" },
      { id: "d", text: "Is allowed below the legal limit without a licence" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Before changing lanes, you must:",
    options: [
      { id: "a", text: "Signal, check mirrors, and check the blind spot" },
      { id: "b", text: "Signal only on highways" },
      { id: "c", text: "Speed up to merge" },
      { id: "d", text: "Rely on other drivers to move away" },
    ],
    correctAnswer: "a",
  },
  {
    question: "When approaching animals on the road, you should:",
    options: [
      { id: "a", text: "Sound the horn continuously" },
      { id: "b", text: "Slow down and be prepared to stop" },
      { id: "c", text: "Accelerate to pass quickly" },
      { id: "d", text: "Flash high beams repeatedly" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Tyres with tread depth below the legal minimum:",
    options: [
      { id: "a", text: "Are fine on dry roads only" },
      { id: "b", text: "Are unsafe and the vehicle may not be roadworthy" },
      { id: "c", text: "Improve braking on gravel" },
      { id: "d", text: "Are allowed on rear wheels only" },
    ],
    correctAnswer: "b",
  },
  {
    question: "At a railway level crossing with flashing lights, you must:",
    options: [
      { id: "a", text: "Cross quickly before the barrier lowers" },
      { id: "b", text: "Stop and wait until the lights stop flashing and it is safe" },
      { id: "c", text: "Sound your horn and proceed" },
      { id: "d", text: "Drive around the barrier if no train is visible" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When towing a trailer, your following distance should be:",
    options: [
      { id: "a", text: "Shorter than normal" },
      { id: "b", text: "Greater than when not towing" },
      { id: "c", text: "The same as for a car" },
      { id: "d", text: "Ignored on open roads" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Using a mobile phone while driving (hand-held):",
    options: [
      { id: "a", text: "Is allowed at low speed" },
      { id: "b", text: "Distracts you and is dangerous — avoid it" },
      { id: "c", text: "Is safer than hands-free" },
      { id: "d", text: "Is required for navigation at all times" },
    ],
    correctAnswer: "b",
  },
  {
    question: "A broken yellow line on your side of the road generally means:",
    options: [
      { id: "a", text: "No overtaking in either direction" },
      { id: "b", text: "Overtaking may be permitted if safe" },
      { id: "c", text: "Parking is allowed" },
      { id: "d", text: "The road is one-way only" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When visibility is reduced by dust or smoke, you should:",
    options: [
      { id: "a", text: "Use high beams at all times" },
      { id: "b", text: "Reduce speed and use dipped headlights" },
      { id: "c", text: "Follow closely behind another vehicle" },
      { id: "d", text: "Stop in the lane and wait without hazard lights" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Passengers in the front seat must:",
    options: [
      { id: "a", text: "Wear seat belts where fitted" },
      { id: "b", text: "Sit on each other's laps if needed" },
      { id: "c", text: "Hold the dashboard in corners" },
      { id: "d", text: "Open windows instead of using air conditioning" },
    ],
    correctAnswer: "a",
  },
  {
    question: "If your vehicle starts to skid on a wet road, you should:",
    options: [
      { id: "a", text: "Brake hard and turn sharply" },
      { id: "b", text: "Ease off the accelerator and steer smoothly in the direction you want to go" },
      { id: "c", text: "Accelerate to regain control" },
      { id: "d", text: "Pull the handbrake immediately" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When parking on a hill facing uphill with a curb, turn the front wheels:",
    options: [
      { id: "a", text: "Towards the curb" },
      { id: "b", text: "Away from the curb" },
      { id: "c", text: "Straight ahead" },
      { id: "d", text: "It does not matter" },
    ],
    correctAnswer: "b",
  },
  {
    question: "A flashing yellow traffic signal means:",
    options: [
      { id: "a", text: "Stop completely" },
      { id: "b", text: "Proceed with caution" },
      { id: "c", text: "The lights are broken — ignore them" },
      { id: "d", text: "You have right of way over all traffic" },
    ],
    correctAnswer: "b",
  },
  {
    question: "The legal blood alcohol limit applies to:",
    options: [
      { id: "a", text: "Drivers only over 25" },
      { id: "b", text: "All drivers — do not drink and drive" },
      { id: "c", text: "Passengers only" },
      { id: "d", text: "Motorcycles only" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When another driver is aggressive behind you, you should:",
    options: [
      { id: "a", text: "Brake suddenly to teach them a lesson" },
      { id: "b", text: "Stay calm, maintain a safe speed, and let them pass when safe" },
      { id: "c", text: "Speed up to get away" },
      { id: "d", text: "Block them from overtaking" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Before starting a long journey, you should check:",
    options: [
      { id: "a", text: "Only fuel level" },
      { id: "b", text: "Tyres, lights, brakes, mirrors, and fluid levels" },
      { id: "c", text: "Radio settings only" },
      { id: "d", text: "Paintwork and interior" },
    ],
    correctAnswer: "b",
  },
  {
    question: "At a roundabout, traffic already on the roundabout:",
    options: [
      { id: "a", text: "Must give way to entering vehicles" },
      { id: "b", text: "Generally has right of way over vehicles entering" },
      { id: "c", text: "Must stop before entering" },
      { id: "d", text: "May be overtaken on the left inside the circle" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Carrying unsecured loads on a vehicle is dangerous because:",
    options: [
      { id: "a", text: "It improves fuel economy" },
      { id: "b", text: "Items can fall off and cause crashes" },
      { id: "c", text: "It lowers the centre of gravity" },
      { id: "d", text: "Police never check loads" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When driving at night, you must dip your headlights:",
    options: [
      { id: "a", text: "When following or meeting other traffic" },
      { id: "b", text: "Only in urban areas" },
      { id: "c", text: "Never — high beam gives best vision" },
      { id: "d", text: "Only when police are present" },
    ],
    correctAnswer: "a",
  },
  {
    question: "A learner driver must:",
    options: [
      { id: "a", text: "Display L plates as required and drive with a valid licence holder when required" },
      { id: "b", text: "Drive alone to gain experience faster" },
      { id: "c", text: "Exceed speed limits to keep up with traffic" },
      { id: "d", text: "Ignore provisional restrictions at night" },
    ],
    correctAnswer: "a",
  },
  {
    question: "If you are involved in a crash, you must:",
    options: [
      { id: "a", text: "Leave immediately if your vehicle is driveable" },
      { id: "b", text: "Stop, assist if safe, exchange details, and report as required" },
      { id: "c", text: "Move your vehicle before checking for injuries" },
      { id: "d", text: "Only report if someone is hurt" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Driving while fatigued:",
    options: [
      { id: "a", text: "Is safe if you drink coffee" },
      { id: "b", text: "Slows reactions — rest before continuing" },
      { id: "c", text: "Only affects long-distance truck drivers" },
      { id: "d", text: "Can be fixed by opening windows only" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When reversing, you should:",
    options: [
      { id: "a", text: "Rely only on mirrors" },
      { id: "b", text: "Check all around the vehicle and reverse slowly" },
      { id: "c", text: "Reverse quickly to save time" },
      { id: "d", text: "Use only the rear-view camera if fitted" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Emergency vehicles with sirens and flashing lights:",
    options: [
      { id: "a", text: "Must obey normal speed limits only" },
      { id: "b", text: "Have priority — give way safely where possible" },
      { id: "c", text: "May be ignored on dual carriageways" },
      { id: "d", text: "Must stop all traffic in both directions always" },
    ],
    correctAnswer: "b",
  },
  {
    question: "A child under the required age/height must:",
    options: [
      { id: "a", text: "Use an approved child restraint where required" },
      { id: "b", text: "Sit in the front seat without a belt" },
      { id: "c", text: "Stand between seats on short trips" },
      { id: "d", text: "Share a seat belt with an adult" },
    ],
    correctAnswer: "a",
  },
  {
    question: "When joining a main road from a side road, you must:",
    options: [
      { id: "a", text: "Force your way into a small gap" },
      { id: "b", text: "Give way to traffic on the main road" },
      { id: "c", text: "Sound your horn continuously" },
      { id: "d", text: "Stop only if a sign requires it" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Driving through deep water on the road requires:",
    options: [
      { id: "a", text: "Maximum speed to clear the flood" },
      { id: "b", text: "Slow speed and caution — water can hide hazards and affect brakes" },
      { id: "c", text: "High revs in first gear only" },
      { id: "d", text: "No change in driving style" },
    ],
    correctAnswer: "b",
  },
  {
    question: "If your brakes feel soft after driving through water, you should:",
    options: [
      { id: "a", text: "Continue at normal speed" },
      { id: "b", text: "Dry them gently by braking lightly while moving slowly" },
      { id: "c", text: "Pump the accelerator" },
      { id: "d", text: "Switch off the engine immediately" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Overtaking on the left is:",
    options: [
      { id: "a", text: "Always the best option" },
      { id: "b", text: "Generally not allowed except in specific situations" },
      { id: "c", text: "Required on multi-lane roads" },
      { id: "d", text: "Safer than overtaking on the right" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When traffic lights fail at an intersection, treat it as:",
    options: [
      { id: "a", text: "A free-for-all" },
      { id: "b", text: "A four-way stop or yield as appropriate" },
      { id: "c", text: "Green light for main road only" },
      { id: "d", text: "No rules apply" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Using seat belts reduces the risk of serious injury because:",
    options: [
      { id: "a", text: "They are optional comfort devices" },
      { id: "b", text: "They keep you secured in a crash" },
      { id: "c", text: "They replace airbags" },
      { id: "d", text: "They are only for front seats" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When driving past parked cars, you should:",
    options: [
      { id: "a", text: "Drive close to them to leave room for overtaking" },
      { id: "b", text: "Leave space for doors opening and pedestrians stepping out" },
      { id: "c", text: "Honk at each vehicle" },
      { id: "d", text: "Speed up to pass the row quickly" },
    ],
    correctAnswer: "b",
  },
  {
    question: "A vehicle's blind spot is:",
    options: [
      { id: "a", text: "The area behind the rear bumper only" },
      { id: "b", text: "An area not visible in mirrors — check over your shoulder" },
      { id: "c", text: "Eliminated by tinted windows" },
      { id: "d", text: "Only on trucks" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When carrying a heavy load, your stopping distance:",
    options: [
      { id: "a", text: "Stays the same" },
      { id: "b", text: "Increases — allow more space" },
      { id: "c", text: "Decreases" },
      { id: "d", text: "Is unaffected on dry roads" },
    ],
    correctAnswer: "b",
  },
  {
    question: "At night, pedestrians wearing dark clothing are hard to see. You should:",
    options: [
      { id: "a", text: "Assume they will see you" },
      { id: "b", text: "Reduce speed and scan the roadside carefully" },
      { id: "c", text: "Use high beam continuously in town" },
      { id: "d", text: "Only drive in well-lit areas" },
    ],
    correctAnswer: "b",
  },
  {
    question: "If your engine overheats, you should:",
    options: [
      { id: "a", text: "Remove the radiator cap immediately" },
      { id: "b", text: "Stop safely, switch off, and allow the engine to cool" },
      { id: "c", text: "Drive faster to increase airflow" },
      { id: "d", text: "Pour cold water on a hot engine while running" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When approaching a blind curve, you should:",
    options: [
      { id: "a", text: "Use the centre of the road" },
      { id: "b", text: "Slow down and keep left unless overtaking is safe" },
      { id: "c", text: "Overtake before the curve" },
      { id: "d", text: "Sound your horn continuously" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Driving with worn windshield wipers in rain:",
    options: [
      { id: "a", text: "Is acceptable at low speed" },
      { id: "b", text: "Reduces visibility and is unsafe" },
      { id: "c", text: "Improves vision through streaking" },
      { id: "d", text: "Is only a problem at night" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When a traffic officer signals you to stop, you must:",
    options: [
      { id: "a", text: "Stop only if you think you broke a law" },
      { id: "b", text: "Stop promptly and cooperate" },
      { id: "c", text: "Drive to the nearest police station instead" },
      { id: "d", text: "Ignore the signal if late for work" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Double parking:",
    options: [
      { id: "a", text: "Is allowed for quick errands" },
      { id: "b", text: "Obstructs traffic and is not permitted" },
      { id: "c", text: "Is safe with hazard lights on" },
      { id: "d", text: "Is allowed outside schools only" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When driving in strong wind, you should:",
    options: [
      { id: "a", text: "Hold the wheel loosely" },
      { id: "b", text: "Grip the wheel firmly and reduce speed" },
      { id: "c", text: "Overtake high-sided vehicles quickly" },
      { id: "d", text: "Open windows for stability" },
    ],
    correctAnswer: "b",
  },
  {
    question: "A red circle sign with a white horizontal bar means:",
    options: [
      { id: "a", text: "No entry for all vehicles" },
      { id: "b", text: "National speed limit" },
      { id: "c", text: "Parking allowed" },
      { id: "d", text: "One-way street" },
    ],
    correctAnswer: "a",
  },
  {
    question: "When waiting to turn right across oncoming traffic, you should:",
    options: [
      { id: "a", text: "Keep wheels turned sharply right while waiting" },
      { id: "b", text: "Wait in position with wheels straight until you can turn safely" },
      { id: "c", text: "Edge into the oncoming lane to hurry traffic" },
      { id: "d", text: "Honk to clear the road" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Using indicators when turning or changing lanes:",
    options: [
      { id: "a", text: "Is optional in light traffic" },
      { id: "b", text: "Informs other road users of your intentions" },
      { id: "c", text: "Confuses other drivers" },
      { id: "d", text: "Is only required at night" },
    ],
    correctAnswer: "b",
  },
  {
    question: "If you miss your exit on a highway, you should:",
    options: [
      { id: "a", text: "Reverse on the shoulder" },
      { id: "b", text: "Continue to the next safe exit" },
      { id: "c", text: "Stop and turn across the median" },
      { id: "d", text: "Make a U-turn on the highway" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Driving through a red light because you are late:",
    options: [
      { id: "a", text: "Is acceptable once" },
      { id: "b", text: "Is illegal and dangerous" },
      { id: "c", text: "Is allowed if no other cars are visible" },
      { id: "d", text: "Is safer than sudden braking" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When approaching a stationary bus unloading passengers, you should:",
    options: [
      { id: "a", text: "Overtake at full speed" },
      { id: "b", text: "Slow down and watch for pedestrians crossing" },
      { id: "c", text: "Honk to warn the driver" },
      { id: "d", text: "Drive on the pavement to pass" },
    ],
    correctAnswer: "b",
  },
  {
    question: "On a gravel road, loose stones can damage other vehicles. You should:",
    options: [
      { id: "a", text: "Drive close to the vehicle ahead" },
      { id: "b", text: "Reduce speed and increase following distance" },
      { id: "c", text: "Overtake on blind rises" },
      { id: "d", text: "Use high beam to warn oncoming traffic" },
    ],
    correctAnswer: "b",
  },
  {
    question: "If your vehicle breaks down on a busy road at night, you should:",
    options: [
      { id: "a", text: "Leave it without warning devices" },
      { id: "b", text: "Move off the roadway if possible and use hazard lights and a warning triangle if available" },
      { id: "c", text: "Stand in the lane to direct traffic" },
      { id: "d", text: "Repair it in the traffic lane" },
    ],
    correctAnswer: "b",
  },
  {
    question: "When a traffic light turns green but vehicles are still in the intersection, you should:",
    options: [
      { id: "a", text: "Enter immediately and force them to move" },
      { id: "b", text: "Wait until the intersection is clear before proceeding" },
      { id: "c", text: "Sound your horn continuously" },
      { id: "d", text: "Drive between the vehicles" },
    ],
    correctAnswer: "b",
  },
  {
    question: "Wearing sunglasses that are too dark while driving:",
    options: [
      { id: "a", text: "Improves night vision" },
      { id: "b", text: "Can reduce visibility — use appropriate eyewear for conditions" },
      { id: "c", text: "Is required by law at all times" },
      { id: "d", text: "Replaces the need for wipers" },
    ],
    correctAnswer: "b",
  },
];

const TARGET_COUNT = 70;
const out = [...core, ...scenarioBank].slice(0, TARGET_COUNT);
const target = path.resolve(process.cwd(), "data", "question-bank.json");
writeFileSync(target, JSON.stringify(out, null, 2), "utf8");
console.log(`Wrote ${out.length} questions to ${target}`);
