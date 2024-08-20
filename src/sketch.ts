// Taken from my code at https://openprocessing.org/sketch/2330168
// which is roughly following https://x.com/TheRujiK/status/969581641680195585
interface Creature {
    id: number;
    phase: number;
    isMouseFollowing: any;
    head: CreatureHead;
    tail: CreatureSegment[];
    colour: p5.Color;
}
interface CreatureFoot {
    pos: p5.Vector;
    size: number;
    facing: number;
    sign: -1 | 1;
}

interface CreatureHead {
    pos: p5.Vector;
    size: number;
    facing: number;
}

interface CreatureSegment {
    pos: p5.Vector;
    size: number;
    facing: number;
    feet: CreatureFoot[];
}

interface Footprint {
    pos: p5.Vector;
    size: number;
    facing: number;
    age: number;
}

let creatures: Creature[];
let footprints: Footprint[];

const config = {
    maxFootprintAge: 200,
    maxFootDistMultiplier: 2.5, //leg length,
    useSquares: true,
    drawContinuousShape: true,
};

function setup() {
    createCanvas(windowWidth, windowHeight);
    regenerate();
}

function draw() {
    background(255);

    for (const footprint of footprints) {
        drawFootprint(footprint);
    }
    for (const creature of creatures) {
        config.drawContinuousShape
            ? drawCreatureContinuous(creature)
            : drawCreature(creature);
        updateCreature(creature);
    }
    footprints.forEach((f) => f.age++);

    if (frameCount % 60 === 0) {
        footprints = footprints.filter((f) => f.age < config.maxFootprintAge);
    }
    textSize(20);
    text("'c' to toggle continuous shape", 10, 30);
}

function keyPressed() {
    if (key === "r") {
        regenerate();
    }
    if (key === "c") {
        toggleBooleanSetting("drawContinuousShape");
    }
}

//BooleanKeys<Config> is the union of the keys of all the boolean properties in Config, but not the string or numeric ones.
type BooleanKeys<T> = {
    [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

function toggleBooleanSetting<K extends BooleanKeys<typeof config>>(
    key: K
): boolean {
    const prevValue = config[key];
    return (config[key] = !prevValue);
}

function regenerate() {
    footprints = [];
    creatures = [];

    for (let i = 0; i < 7; i++) {
        creatures.push(createCreature(i));
    }
    creatures.push(
        createCreature(8, {
            followMouse: true,
        })
    );
}

function drawFootprint(footprint: Footprint) {
    push();
    translate(footprint.pos);
    rotate(footprint.facing);
    noStroke();
    const alph = map(footprint.age, 0, config.maxFootprintAge, 50, 0, true);
    fill(150, alph);
    rectMode(CENTER);
    square(0, 0, footprint.size);
    pop();
}

function drawCreature(cr: Creature) {
    const { head, tail, colour } = cr;

    push();

    //outline
    strokeWeight(10);
    fill(colour);
    // noStroke()

    drawCreatureTail(cr, tail, true);
    drawCreatureHeadAsBox(cr);

    stroke("orange");
    strokeWeight(5);

    drawCreatureTail(cr, tail, true);
    drawCreatureHeadAsBox(cr);

    noStroke();

    drawCreatureTail(cr, tail, false);
    drawCreatureHeadAsBox(cr);

    pop();
}

function drawCreatureContinuous(cr: Creature) {
    const { tail, colour } = cr;

    push();
    fill(colour);
    const pts = collectPoints(cr.head, tail);

    fillShape(pts, 10, color(30));
    fillShape(pts, 4, color("orange"));

    drawCreatureHeadForContinuous(cr);

    pop();
}

function fillShape(pts: p5.Vector[], weight: number, colr: p5.Color) {
    strokeWeight(weight);
    stroke(colr);
    beginShape();
    for (const pt of pts) {
        vertex(pt.x, pt.y);
    }
    endShape(CLOSE);
}

function drawCreatureHeadForContinuous({ head }: Creature) {
    const sz = head.size;
    push();
    translate(head.pos);
    rotate(head.facing);
    rectMode(CENTER);

    //eyes
    strokeWeight(1);

    for (const sign of [-1, 1]) {
        push();
        translate(0, sign * sz * 0.5);
        fill("white");
        circle(0, 0, sz / 2);
        fill(30);
        circle(0, 0, sz / 4);
        pop();
    }
    pop();
}
function drawCreatureHeadAsBox({ head }: Creature) {
    const sz = head.size;
    push();
    translate(head.pos);
    rotate(head.facing);
    rectMode(CENTER);
    square(0, 0, sz);

    //eyes

    for (const sign of [-1, 1]) {
        push();
        translate(0, sign * sz * 0.5);

        fill("white");
        circle(0, 0, sz / 3);
        fill(30);
        circle(0, 0, sz / 6);
        pop();
    }
    pop();
}

function drawFoot(cr: Creature, seg: CreatureSegment, foot: CreatureFoot) {
    push();
    translate(foot.pos);
    rotate(foot.facing);
    rectMode(CENTER);
    square(0, 0, foot.size);
    pop();
}

function drawLeg(
    cr: Creature,
    seg: CreatureSegment,
    foot: CreatureFoot,
    isOutline: boolean
) {
    push();
    if (isOutline) {
        strokeWeight(seg.size * 0.6);
        stroke(40);
    } else {
        strokeWeight(seg.size * 0.33);
        stroke(cr.colour);
    }

    line(seg.pos.x, seg.pos.y, foot.pos.x, foot.pos.y);
    pop();
}

function drawCreatureTail(
    cr: Creature,
    tail: CreatureSegment[],
    isOutline: boolean
) {
    for (const seg of tail) {
        for (const foot of seg.feet) {
            drawFoot(cr, seg, foot);
            //leg
            drawLeg(cr, seg, foot, isOutline);
        }
    }

    for (const seg of tail) {
        push();
        translate(seg.pos);
        rotate(seg.facing);
        rectMode(CENTER);
        const shapeFn = config.useSquares ? square : circle;
        const sizeMult = config.useSquares ? 1.1 : 1.2;
        shapeFn(0, 0, seg.size * sizeMult);

        pop();
    }
}

function createCreature(
    id: number,
    { followMouse } = {
        followMouse: false,
    }
): Creature {
    const size =
        random() < 0.01 ? 80 : random([10, 20, 30, 30, 30, 40, 40, 50]);
    const head = {
        pos: createVector(random(width), random(height)),
        facing: 0,
        size,
    };
    const phase = random(TWO_PI);
    return {
        id,
        head,
        phase,
        isMouseFollowing: followMouse,
        colour: randomCreatureColour(),
        tail: createCreatureTail({
            headPos: head.pos,
            numSegments: 10,
            maxSize: head.size * 0.8,
            phase,
        }),
    };
}

function createCreatureTail({
    numSegments,
    maxSize,
    headPos,
    phase,
}: {
    numSegments: number;
    maxSize: number;
    headPos: p5.Vector;
    phase: number;
}): CreatureSegment[] {
    const segments = [];
    for (let i = 0; i < numSegments; i++) {
        const t = PI * map(i, 0, numSegments - 1, 0.3, 1, true);
        const size = map(sin(t), 0, 1, 0.3, 1, true) * maxSize;

        const seg = {
            pos: createVector(i * 20, 100 * sin(phase + i / 8)).add(headPos),
            facing: 0,
            size,
            feet: [] as CreatureFoot[],
        };
        const segmentShouldHaveFeet = (i - 1) % 4 === 0; //&& i < numSegments*0.6;
        const feet = segmentShouldHaveFeet ? createFeet(seg) : [];
        seg.feet.push(...feet);
        segments.push(seg);
    }
    return segments;
}

/**
 * @returns {p5.Vector | null}
 */
function calcTargetPos(cr: Creature) {
    if (cr.isMouseFollowing) {
        const mousePos = getMousePos();
        const deltaToMousePos = p5.Vector.sub(mousePos, cr.head.pos);
        if (deltaToMousePos.mag() < cr.head.size) {
            return null;
        }
        return deltaToMousePos.setMag(cr.head.size).add(cr.head.pos);
    }

    const centrePos = createVector(width / 2, height / 2);
    const shouldHeadBack =
        cr.head.pos.x > width ||
        cr.head.pos.x < 0 ||
        cr.head.pos.y > height ||
        cr.head.pos.y < 0;
    const angleToCentre = p5.Vector.sub(centrePos, cr.head.pos).heading();

    const turnAmount = 0.1;
    const basicAngleForTargetPos = shouldHeadBack
        ? angleToCentre
        : cr.head.facing;
    const offset = p5.Vector.fromAngle(basicAngleForTargetPos, cr.head.size);
    const steerAngle = map(
        noise(cr.phase * 100 + frameCount / 50),
        0.1,
        0.9,
        -turnAmount,
        turnAmount,
        true
    );
    offset.rotate(steerAngle);
    return p5.Vector.add(cr.head.pos, offset);
}

function updateCreature(cr: Creature) {
    const targetPos = calcTargetPos(cr);
    if (targetPos) {
        cr.head.pos.lerp(targetPos, 0.1);
        cr.head.facing = p5.Vector.sub(targetPos, cr.head.pos).heading();
    }
    updateCreatureTail(cr);
}

function updateCreatureTail(cr: Creature) {
    let leader = cr.head;
    for (const seg of cr.tail) {
        const towardsLeaderVec = p5.Vector.sub(leader.pos, seg.pos);
        if (leader.pos.dist(seg.pos) > cr.head.size) {
            seg.pos.lerp(leader.pos, 0.1);
        }
        seg.facing = towardsLeaderVec.heading();
        // seg.pos.add(p5.Vector.random2D().mult(1))

        updateSegmentFeet(cr, seg);

        leader = seg;
    }
}

function getMousePos() {
    return createVector(mouseX, mouseY);
}

function createFeet(seg: CreatureSegment): CreatureFoot[] {
    const feet = [];
    for (const sign of [-1, 1] as (-1 | 1)[]) {
        feet.push({
            pos: calcFootPositionForSegment(seg, sign),
            sign,
            facing: seg.facing,
            size: seg.size / 2,
        });
    }
    return feet;
}

function pushTailSegmentsAwayFromFoot(
    cr: Creature,
    connectedSeg: CreatureSegment,
    foot: CreatureFoot
) {
    for (const otherSeg of cr.tail) {
        if (otherSeg === connectedSeg) {
            continue;
        }
        const d = max(0.000001, otherSeg.pos.dist(connectedSeg.pos));
        const invers = 1 / d;
        //TODO: this makes some segments rotate with a flicker.  perhaps their paths to next segment are momentarily too different
        const pushVec = p5.Vector.sub(otherSeg.pos, foot.pos).setMag(
            connectedSeg.size * invers
        );
        otherSeg.pos.add(pushVec);
    }
}

function updateSegmentFeet(cr: Creature, seg: CreatureSegment) {
    const maxFootDistance = seg.size * config.maxFootDistMultiplier;
    for (const foot of seg.feet) {
        const idealPos = calcFootPositionForSegment(seg, foot.sign);
        const d = foot.pos.dist(idealPos);
        if (d > maxFootDistance) {
            foot.pos = idealPos;
            footprints.push({
                age: 0,
                pos: foot.pos,
                facing: foot.facing,
                size: foot.size,
            });
        }
        foot.facing = seg.facing;
        // pushTailSegmentsAwayFromFoot(cr, seg, foot);
    }
}

function calcFootPositionForSegment(seg: CreatureSegment, sign: 1 | -1) {
    const footAngleOffset = (sign * PI) / 8;
    const distToFoot = seg.size * config.maxFootDistMultiplier;
    const vecTowardsFoot = p5.Vector.fromAngle(
        seg.facing + footAngleOffset,
        distToFoot
    );
    const footPos = p5.Vector.add(seg.pos, vecTowardsFoot);
    return footPos;
}

function randomCreatureColour() {
    push();
    colorMode(HSB);
    const c = color(random(360), random(60, 100), 100);
    pop();
    return c;
}
function collectPoints(
    head: CreatureHead,
    tail: CreatureSegment[]
): p5.Vector[] {
    const headPoints = getPointPairsForSegmentOrHead(head);

    const midpointsForHead = [PI / 8, 0, -PI / 8].map((angle) =>
        polarToCartesian(head.size / 2, head.facing + angle).add(head.pos)
    );
    const lastSegment = tail.at(-1);

    const midpointsForTail = [PI / 8, 0, -PI / 8].map((angle) =>
        polarToCartesian(
            lastSegment.size / 2,
            PI + lastSegment.facing + angle
        ).add(lastSegment.pos)
    );

    const ptPairs = tail.map(getPointPairsForSegmentOrHead);
    return [
        headPoints[0],
        ...ptPairs.map((pair) => pair[0]),
        ...midpointsForTail,
        ...[...ptPairs].reverse().map((pair) => pair[1]),
        headPoints[1],
        ...midpointsForHead,
    ];
}

function getPointPairsForSegmentOrHead(
    seg: CreatureHead | CreatureSegment
): [p5.Vector, p5.Vector] {
    return [-PI / 2, PI / 2].map((angleOffset) =>
        polarToCartesian(seg.size / 2, seg.facing + angleOffset).add(seg.pos)
    ) as [p5.Vector, p5.Vector];
}

function polarToCartesian(r: number, theta: number): p5.Vector {
    return createVector(r * cos(theta), r * sin(theta));
}
