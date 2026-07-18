<h1> CrowdSense AI </h1>

<b>Chosen Vertical:</b> Smart City / Public Safety
<br/>
<b>Problem Statement: </b>
   <pre>
        Large events like concerts and stadium games suffer from a high risk of crowd crushes, gate congestion, and poor navigation to safety. Static signage cannot adapt dynamically to sudden     crowd             surges, leaving attendees vulnerable.
           
   </pre>     
<br/>
<b>Solution Overview: </b>
<pre>
        CrowdSense AI uses real-time simulation data, AI analysis, and interactive mapping to protect up to 10,000 attendees by intelligently routing them and managing venue load. It acts as a safety HUD for        event coordinators to view live capacity metrics, while giving users personalized map routing directly on their mobile screens.
</pre>

<br/>
<b>Google Services Used:</b>
<pre>
        ServiceHow It's UsedGemini 1.5 FlashReal-time AI crowd analysis + natural language Q&AGoogle Maps JS APILive venue heatmap with HeatmapLayer overlayFirebase AuthGoogle Sign-In with role-based access         controlFirebase FirestoreReal-time crowd data with security rulesFirebase FCMEmergency push notifications to all attendeesFirebase HostingProduction deployment
</pre>
<br/>
<b>Setup Instructions:</b>
<pre>
    Clone this repository to your local machine.<br/>
    Ensure you have Node.js installed.<br/>
    Run npm install to install dependencies. <br/>
    Rename .env.example to .env and fill out your Firebase, Google Maps, and Gemini API keys.<br/>
    Run npm run dev to start the local development server.<br/>

</pre>
<br/>
<b>Core Logic</b>
<pre>
    Routing Algorithm (routing.js): Uses a Dijkstra-inspired weighted shortest-path selection to route users, considering queue lengths, distance to gate, and current crowdedness (density factor).<br/>
    Gemini Prompting Strategy: Pipes JSON context of the crowd density to trigger analytical summaries and identify immediate safety warnings locally.<br/>
    Simulation Engine: Generates realistic drifting coordinate data points simulating 3,500 attendees across 6 zones, creating randomized crowd surges.<br/>
</pre>
<br/>
<b>Assumptions Made</b>
<pre>
    GPS coordinates are simulated, drifting within a hardcoded fictional venue.<br/>
    Distances between zones and gates are predetermined fixed minute values in a hardcoded distance matrix.<br/>
    The dashboard relies heavily on pure React state synced with simulated data rather than true thousands of constant WebSocket events, scaled down for competition demonstration capability.<br/>
</pre>
<br/>
<b>Testing</b>
<pre>
    Run npm test to execute the Vitest suite, which covers routing, calculations, simulation metrics, and core architectural logic.
</pre>
