
export type Coordinates = [number, number];

export type DirectionStep = {
  instruction: string;
  distance: number;
  duration: number;
  roadName: string;
};

export type RouteResult = {
  coordinates: Coordinates[];
  distance: number;
  duration: number;
  steps: DirectionStep[];
};

type OsrmRouteResponse = {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: Coordinates[];
    };
    legs: Array<{
      steps: Array<{
        distance: number;
        duration: number;
        name?: string;
        maneuver: {
          type: string;
          modifier?: string;
          exit?: number;
          bearing_after?: number;
        };
      }>;
    }>;
  }>;
};

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

function describeManeuver(
  type: string,
  modifier?: string,
  exit?: number,
): string {
  const direction = modifier?.replace(/_/g, ' ');

  switch (type) {
    case 'depart':
      return 'Start your journey';

    case 'arrive':
      return 'You have arrived at your destination';

    case 'turn':
      return `Turn ${direction ?? 'ahead'}`;

    case 'new name':
      return 'Continue onto the new road';

    case 'continue':
      return direction
        ? `Continue ${direction}`
        : 'Continue straight';

    case 'merge':
      return `Merge${direction ? ` ${direction}` : ''}`;

    case 'on ramp':
      return 'Take the ramp';

    case 'off ramp':
      return 'Take the exit ramp';

    case 'fork':
      return `At the fork, keep ${direction ?? 'straight'}`;

    case 'end of road':
      return `At the end of the road, turn ${direction ?? 'ahead'}`;

    case 'roundabout':
    case 'rotary':
      return exit
        ? `Enter the roundabout and take exit ${exit}`
        : 'Enter the roundabout';

    case 'roundabout turn':
      return 'Continue through the roundabout';

    case 'notification':
      return 'Continue following the route';

    case 'use lane':
      return 'Follow the indicated lane';

    default:
      return direction
        ? `${type.replace(/_/g, ' ')} ${direction}`
        : type.replace(/_/g, ' ');
  }
}

export async function getDrivingRoute(
  origin: Coordinates,
  destination: Coordinates,
): Promise<RouteResult> {
  const allCoordinates = [...origin, ...destination];

  if (
    !allCoordinates.every(Number.isFinite) ||
    origin[1] < -90 ||
    origin[1] > 90 ||
    destination[1] < -90 ||
    destination[1] > 90 ||
    origin[0] < -180 ||
    origin[0] > 180 ||
    destination[0] < -180 ||
    destination[0] > 180
  ) {
    throw new Error('The starting point or destination coordinates are invalid.');
  }

  const coordinates = [
    `${origin[0]},${origin[1]}`,
    `${destination[0]},${destination[1]}`,
  ].join(';');

  const url =
    `${OSRM_BASE_URL}/${coordinates}` +
    '?overview=full&geometries=geojson&steps=true';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `The routing service returned an error (${response.status}). Please try again.`,
    );
  }

  const data = (await response.json()) as OsrmRouteResponse;

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(
      data.message || 'No driving route was found for these locations.',
    );
  }

  const route = data.routes[0];

  if (
    !route.geometry?.coordinates ||
    route.geometry.coordinates.length < 2
  ) {
    throw new Error('The routing service returned an invalid route.');
  }

  const steps: DirectionStep[] = route.legs.flatMap((leg) =>
    leg.steps.map((step) => ({
      instruction: describeManeuver(
        step.maneuver.type,
        step.maneuver.modifier,
        step.maneuver.exit,
      ),
      distance: step.distance,
      duration: step.duration,
      roadName: step.name ?? '',
    })),
  );

  return {
    coordinates: route.geometry.coordinates,
    distance: route.distance,
    duration: route.duration,
    steps,
  };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes === 0
    ? `${hours} hr`
    : `${hours} hr ${minutes} min`;
}
