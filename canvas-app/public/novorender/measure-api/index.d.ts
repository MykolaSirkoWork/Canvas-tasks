/// <reference types="gl-matrix" />

declare module "@novorender/measure-api" {
  import type { CylinderData, PlaneData, SurfaceData, FaceData } from "./src/worker/brep";

  type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
    U[keyof U];

  import type {
    ReadonlyVec3,
    ReadonlyVec4,
    ReadonlyQuat,
    ReadonlyMat3,
    vec3,
    quat,
    ReadonlyMat4,
    ReadonlyVec2,
    vec2,
  } from "gl-matrix";

  import type { CylinderOptions } from "./src/index";

  export declare class MeasureError extends Error {
    constructor(readonly type: string, message: string);
  }

  type CylinderOptions = typeof cylinderOptions;
  export type CylinerMeasureType = {
    [K in keyof CylinderOptions]: CylinderOptions[K] extends string
    ? CylinderOptions[K]
    : never;
  }[keyof CylinderOptions];

  /** 2d profile with slope information */
  export interface Profile {
    readonly profilePoints: ReadonlyVec2[];
    /** slope between points for n and n -1 */
    readonly slopes: number[];
    /** Highetst Z value on the profile */
    readonly top: number;
    /** Lowest Z value on the profile */
    readonly bottom: number;
    /** Start Z value of the profile */
    readonly startElevation: number;
    /** End Z value of the profile */
    readonly endElevation: number;
  }

  /** Additional options for measurement */
  export interface MeasureSettings {
    /** Where to measure cylinder from, in case of measure between two cylinder, same option will be used for both*/
    cylinderMeasure: CylinerMeasureType;
  }

  /** Hole in a filled  polygon */
  export interface DrawVoid {
    /** View space coordinates, in pixel values, empty if the entire part is out of view*/
    vertices2D?: ReadonlyVec2[];
    /** World coordinates*/
    vertices3D: ReadonlyVec3[];
  }

  /** Information about object to draw for measurement */
  export interface DrawPart {
    /** Name of the part */
    readonly name?: string;
    /** Display text of the part,
     * For lines of 2 points it is the length
     * For angles its the angle in degrees
     * For surfaces its a list of list strings. One list for out then for its voids 
     */
    text?: string | string[][];
    /** Type of object to draw */
    readonly drawType: "lines" | "filled" | "vertex" | "curveSegment" | "angle" | "text";
    /** From/to 3d elevation of object, used for cylinder to show slope */
    readonly elevation?: { from: number; to: number; horizontalDisplay: boolean };
    /** Hole in the draw part,  only valid for filled kind*/
    readonly voids?: DrawVoid[];
    /** View space coordinates, in pixel values, empty if the entire part is out of view*/
    vertices2D?: ReadonlyVec2[];
    /** World coordinates*/
    vertices3D: ReadonlyVec3[];
  }

  /** An object for 2d drawings, can contain multiple parts */
  export interface DrawObject {
    /** Type of draw object */
    readonly kind: "cylinder" | "plane" | "edge" | "curveSegment" | "vertex" | "complex" | "text";
    /** Different parts of the object */
    readonly parts: DrawPart[];
  }

  /** A hierarcical structure to draw 2d objects */
  export interface DrawProduct {
    /** Type of draw prouct */
    readonly kind: "basic" | "manhole" | "measureResult";
    /** Objects to draw */
    readonly objects: DrawObject[];
  }

  /** Tolerance for picking and snapping to parametric objects */
  export interface SnapTolerance {
    segment?: number;
    edge?: number;
    face?: number;
    point?: number;
  }

  /** Parameter bounds */
  export interface ParameterBounds {
    /** Start of parameter */
    readonly start: number;
    /** End of parameter*/
    readonly end: number;
  }

  /** MeasurementValues is a collection of values for any measurment */
  export type MeasurementValues =
    | EdgeValues
    | FaceValues
    | DuoMeasurementValues;

  /** EdgeValues is a collection of values for measurment on a single edge */
  export type EdgeValues = LineValues | ArcValues | LineStripValues;

  /** LineValues is a collection of values for measuring a single line */
  export interface LineValues {
    readonly kind: "line";
    /** Distance from the start to the end of the line */
    readonly distance: Number;
    /** Gradient of the line */
    readonly gradient: vec3;
    /** The start of the line */
    readonly start: vec3;
    /** The end of the line */
    readonly end: vec3;
  }

  /** ArcValues is a collection of values for measuring a single arc */
  export interface ArcValues {
    readonly kind: "arc";
    /** Radius of the arc */
    readonly radius: number;
    /** Angle of the arc segment */
    readonly totalAngle: number;
  }

  /** LineStripValues is a collection of values for measuring a line strip */
  export interface LineStripValues {
    readonly kind: "lineStrip";
    /** Accumulated length of all lines in strip */
    readonly totalLength?: number;
  }

  /** FaceValues is a collection of values for measurment on a single face */
  export type FaceValues = PlaneValues | CylinderValues;

  /** PlaneValues is a collection of values for measuring a single Plane */
  export interface PlaneValues {
    readonly kind: "plane";
    /** Width of the plane */
    readonly width?: number;
    /** Height of the plane */
    readonly height?: number;
    /** Largest outer radius of the plane in case of only arcs */
    readonly outerRadius?: number;
    /** Largest inner radius of the plane in case of only arcs */
    readonly innerRadius?: number;
    /** Normal of the plane */
    readonly normal: vec3;
    /** Calculated area of the plane */
    readonly area?: number;
    /** Corner vertices of the plane */
    readonly vertices: vec3[];
    /** Outer edges of the plane*/
    readonly outerEdges: EdgeValues[];
    /** Inner edges of the plane*/
    readonly innerEdges: EdgeValues[][];
    /** Y value of the plane origin*/
    readonly heightAboveXyPlane?: number;
    readonly entity: SelectedEntity;
  }

  /** CylinderValues is a collection of values for measuring a single cylinder */
  export interface CylinderValues {
    readonly kind: "cylinder";
    /** Cylinder radius */
    readonly radius: number;
    /** Start of the line going in the center of the cylinder */
    readonly centerLineStart: vec3;
    /** End of the line going in the center of the cylinder */
    readonly centerLineEnd: vec3;
    /** Entity */
    readonly entity: SelectedEntity;
  }

  export interface MeasureObjectInfo {
    /** Closest point on object */
    readonly point?: vec3;
    /** Parameter on closest point, one if its a curve 2 if its a surface */
    readonly parameter?: number | [number, number]
    /** The valid measurement settings for object*/
    readonly validMeasureSettings?: boolean;
  }

  /** DuoMeasurementValues is a collection of values for measuring two objects */
  export interface DuoMeasurementValues {
    readonly drawKind: "measureResult";
    /** Total distance between the objects */
    readonly distance?: number;
    /** Total normdistance between the objects from object A */
    readonly normalDistance?: number;
    /** Distance on the X plane between the objects */
    readonly distanceX: number;
    /** Distance on the Y plane between the objects */
    readonly distanceY: number;
    /** Distance on the Z plane between the objects */
    readonly distanceZ: number;
    /** Angle between objects, used for cylinders, and the directions*/
    readonly angle?: {
      radians: number, angleDrawInfo: [vec3, vec3, vec3], additionalLine?: [vec3, vec3]
    };
    /** Point to display normal distance between objects from object A */
    readonly normalPoints?: vec3[] | undefined;
    /** information about the first object of calculation */
    readonly measureInfoA?: MeasureObjectInfo,
    /** information about the second object of calculation */
    readonly measureInfoB?: MeasureObjectInfo,
  }

  /** Gives values based on selected linestrip*/
  export interface LineStripMeasureValues {
    /** The total length of the linestrip */
    readonly totalLength: number;
    /** The input vertices */
    readonly linestrip: ReadonlyVec3[];
    /** List of lenths based on line segments starting with segment between vertex 0 and 1  */
    readonly segmentLengts: number[];
    /** List of angles between line segments starting with angle between segment 0 and 1  */
    readonly angles: number[];
  }

  /** An entity that can be used in Api.getDrawMeasureEntity, Objects returned from the api with draw kind parameter can be used*/
  export interface DrawableEntity {
    /** Object id from the web-gl api*/
    readonly ObjectId?: Public.ObjectId;
    /** Collection of kinds that can be drawn using Api.getDrawMeasureEntity*/
    readonly drawKind: "edge" | "face" | "vertex" | "curveSegment" | "manhole" | "measureResult";
  }

  /** Gives values based on selected manhole, 
   * must contain a top plane, bottom plane an a cylinder running for atleast 50% of the distance between top and bottom 
   * Tesselated manholes will not work */
  export interface ManholeMeasureValues {
    /** Can be drawn by Api.getDrawMeasureEntity*/
    readonly drawKind: "manhole";
    /** Object id from the web-gl api*/
    readonly ObjectId: Public.ObjectId;
    /** Plane at the top of the manhole*/
    readonly top: PlaneValues;
    /** Z value of the top plane, center is used if tilted*/
    readonly topElevation: number;
    /** Outer bottom plane of the manhole*/
    readonly bottomOuter: PlaneValues;
    /** Z value of the outer bottom plane, center is used if tilted*/
    readonly bottomOuterElevation: number;
    /** Inner bottom plane, can only be found if circular planes are used, else this is always undefiend*/
    readonly bottomInner?: PlaneValues;
    /** Z value of the inner bottom plane, center is used if tilted*/
    readonly bottomInnerElevation?: number;
    /** Inner cylinder if there are 2 cylinders in the manhole */
    readonly inner?: CylinderValues;
    /** Radius of the inner cylinder */
    readonly innerRadius?: number;
    /** Radius of the outer cylinder, outer will be chosen if only one exists */
    readonly outer: CylinderValues;
    /** Radius of the outer cylinder */
    readonly outerRadius: number;
    /** Internal values used for drawing */
    readonly internal: {
      readonly top: FaceData;
      readonly bottomOuter: FaceData;
      readonly bottomInner?: FaceData;
      readonly inner?: FaceData;
      readonly outer: FaceData;
    }
  }

  /** Gives values to create a camera based on selected object */
  export interface CameraValues {
    /** Normalized direction */
    normal: ReadonlyVec3;
    /** World position */
    position: ReadonlyVec3;
  }

  /** Used to get camera values along a curve segment or cylinder center */
  export interface FollowParametricObject {
    /** Type of object that is being followed */
    readonly type: "edge" | "curve" | "cylinder" | "cylinders";
    /** Collection of Object Ids, if multiple then it must be following cylinders*/
    readonly ids: Public.ObjectId[];
    /** Information about the entity, used to avoid finding the objects in api functions*/
    readonly selectedEntity: MeasureEntity | undefined;
    /** Start and stop bounds of the followed object, 
     * unless the parametric object specify otherwise start will be 0 and end will be the length of all segments*/
    readonly parameterBounds: ParameterBounds;
    /** Returns camera values for given parameter T,
     * if T is before start it will return camera values at start and if its larger than end it will return camera values for end*/
    getCameraValues(t: number): Promise<CameraValues | undefined>;
  }

  /** Measure api loads from same scene assets. Brep files are required*/
  export interface MeasureAPI {
    /** Same scene url as the corresponding webgl api load scene*/
    loadScene(url: URL | string): Promise<MeasureScene>;
    dispose(): Promise<void>;
    /** Converts world space points to on screen pixel path and points*/
    toPathPoints(
      points: ReadonlyVec3[],
      view: View,
    ): { screenPoints: ReadonlyVec2[], points2d: ReadonlyVec2[], removedIndices: number[] } | undefined;

    /** Converts world space points to on screen pixel points. Input and output are of equal length. */
    toMarkerPoints(
      view: View,
      points: ReadonlyVec3[],
    ): (ReadonlyVec2 | undefined)[];

    /** Returns a hierarcical structure of the element, describing how it should be drawn in 2d*/
    getDrawMeasureEntity(
      view: Public.View,
      scene: MeasureScene,
      entity: DrawableEntity,
      setting?: MeasureSettings
    ): Promise<(DrawProduct | undefined) | undefined>;
    /** Returns a hierarcical structure describing how it should be drawn in 2d, 
     * should be used instead of getDrawMeasureEntity when a drawable entity is not available */
    getDrawObjectFromPoints(view: Public.View, points: ReadonlyVec3[], closed: boolean = true, angles: boolean = true, generateLineLabels: boolean = false): DrawProduct | undefined;

    /** Returns a draw object that places a text based on input points */
    getDrawText(view: Public.View, points: ReadonlyVec3[], text: string): DrawProduct | undefined;

    /** Returns a draw object that traces intersection between the 2d paths and displays the 3d distance as a label */
    traceDrawObjects(objects: DrawProduct[], line: { start: ReadonlyVec2, end: ReadonlyVec2 }): DrawProduct;

    /** returs the 2d normal of the first draw object the line hits */
    get2dNormal(object: DrawProduct, line: { start: ReadonlyVec2, end: ReadonlyVec2 }): { normal: ReadonlyVec2, position: ReadonlyVec2 } | undefined;
  }

  /** Scene with objects being measured. Brep files are required*/
  export interface MeasureScene {
    /** Measure objet, if b is undefined then single measure values are returned else the measurement between 2 objects*/
    measure(
      a: MeasureEntity,
      b?: MeasureEntity,
      settingA?: MeasureSettings,
      settingB?: MeasureSettings
    ): Promise<MeasurementValues | undefined>;

    /** Returns collision values between 2 entities
     * currently only works for two cylinders
    */
    async collision(
      a: SelectedEntity,
      b: SelectedEntity,
      setting?: MeasureSettings
    ): Promise<CollisionValues | undefined>;

    /** Measure distance between a measurement object an a 3d point*/
    measureToPoint(
      a: MeasureEntity,
      b: ReadonlyVec3,
      setting?: MeasureSettings
    ): Promise<DuoMeasurementValues | undefined>;

    /** Measure distance between 2 points*/
    pointToPoint(a: ReadonlyVec3, b: ReadonlyVec3): DuoMeasurementValues;

    /** Get suggested camea values for selected object
     * For cylinder values snap to the closest axis on the cylinder*/
    getCameraValues(
      a: MeasureEntity,
      cameraDir: vec3
    ): Promise<CameraValues | undefined>;

    /** Returns the measure entity for given object and location**/
    pickMeasureEntity(
      id: Public.ObjectId,
      selectionPosition: ReadonlyVec3,
      tolerance?: SnapTolerance
    ): Promise<{ entity: MeasureEntity, status: BrepStatus, connectionPoint?: vec3 }>;

    /** Returns the measure entity for given object and location if the current object is selected
     *  This is much faster than pickMeasureEntity and can be used for hover**/
    pickMeasureEntityOnCurrentObject(
      id: Public.ObjectId,
      selectionPosition: ReadonlyVec3,
      tolerance: SnapTolerance
    ): Promise<{ entity: MeasureEntity | undefined, status: BrepStatus, connectionPoint?: vec3 }>;

    /** Returns the entire parametric hierarchy,
     *  returns undefined upon abort*/
    getParametricProduct(
      id: Public.ObjectId
    ): Promise<ParametricProduct | undefined>;

    /** Returns the profile view of a linestrip where x is the length of the line and y is the height*/
    getProfileViewFromEntity(
      entity: MeasureEntity,
      setting?: MeasureSettings
    ): Promise<Profile | undefined>;

    /** Returns the profile view of selected objects where x is the length of the line and y is the height,
     * currently only supports cylinders
     */
    getProfileViewFromMultiSelect(
      ids: Public.ObjectId[],
      setting?: MeasureSettings
    ): Promise<Profile | undefined>;

    /** Return reveresed input profile*/
    reverseProfile(inProfile: Profile): Profile;

    /** Returns an object that can be used to calculate camera posisiotns that follow the object
     * Supports Edges, curve segments and cylinder
     */
    followParametricObjectFromPosition(
      id: Public.ObjectId,
      selectionPosition: ReadonlyVec3,
      setting?: MeasureSettings

    ): Promise<FollowParametricObject | undefined>;

    /** Returns an object that can be used to calculate camera posisiotns that follow the objects
     * Supports multiple cylinder,
     * In case of one object, and that object only containing one curve segment it will return curve segment
     */
    followParametricObjects(
      ids: Public.ObjectId[],
      setting?: MeasureSettings
    ): Promise<FollowParametricObject | undefined>;

    /** Calculates the area from polygon.
     * Treat polygon as closed.
     * y is treated as height and is ignored.*/
    areaFromPolygon(
      vertices: ReadonlyVec3[],
      normals: ReadonlyVec3[]
    ): { area: number; polygon: ReadonlyVec3[] };

    /** Measure between multiple points.*/
    measureLineStrip(vertices: ReadonlyVec3[]): LineStripMeasureValues;
    /** Object inspection, where the entire parametric object is treated as the input object type*/
    inspectObject(productId: number, objectType: "manhole"): Promise<ManholeMeasureValues | undefined>;

    /** Swaps between inner and outer cylinder, returns undefined if there is only one*/
    swapCylinder(entity: MeasureEntity, to: "inner" | "outer"): Promise<MeasureEntity | undefined>;

    getRoadProfile(roadId: string): Promise<RoadProfiles | undefined>;
    getCrossSlope(roadId: string): Promise<CrossSlope | undefined>;
    getCrossSections(roadIds: string[], profileNumber: number): Promise<RoadCrossSection[]>;
  }

  /** Interface often used in the measure-api to describe a selected parametric object,
   * It can either be an object or a simple 3d point
   * Any measure entity can be drawn using getDrawMeasureEntity
  */
  export type MeasureEntity = SelectedEntity | PointEntity;

  export type BrepStatus = "loaded" | "unknown" | "missing";

  /** Interface often returned from measure-api calles, can be used as input to modify the entity
  */
  export interface SelectedEntity {
    /** Object id from the web-gl api*/
    ObjectId: Public.ObjectId;
    drawKind: "edge" | "face" | "curveSegment";
    /** Used internally */
    pathIndex: number;
    /** Used internally */
    instanceIndex: number;
    /** Used internally */
    parameter?: number | ReadonlyVec2 | ReadonlyVec3;
  }


  export interface PointEntity {
    ObjectId: Public.ObjectId;
    drawKind: "vertex";
    /** Used internally */
    pathIndex?: number;
    /** Used internally */
    instanceIndex?: number;
    /** Used internally */
    parameter: ReadonlyVec3;
  }

  export function createMeasureAPI(scriptBaseUrl?: string): MeasureAPI;

  /** Collision values*/
  export interface CollisionValues {
    /** Collision point between two objects*/
    readonly point: vec3;
  }

  export interface RoadCrossSection {
    readonly points: ReadonlyVec3[],
    readonly points2D: ReadonlyVec2[],
    readonly labels: string[],
    //Slope from centerline to shoulder  [left, Right] 
    readonly slopes: {
      left: { slope: number, start: ReadonlyVec3, end: ReadonlyVec3 },
      right: { slope: number, start: ReadonlyVec3, end: ReadonlyVec3 }
    },
    readonly codes: number[]
  }

  export interface RoadProfile {
    name: string,
    elevations: number[]
  }

  export interface RoadProfiles {
    readonly name: strig,
    readonly profiles: RoadProfile[],
    readonly intervals: number[]
  }

  export interface CrossSlope {
    readonly left: number[],
    readonly right: number[],
    readonly intervals: number[]
  }
}
