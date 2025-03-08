import * as THREE from "three";
import blockTypeDictionary from "../../blocks/blocks.js";

export class Physics {

    simulationRate = 200;
    timeslice = 1 / this.simulationRate;
    keeper = 0;
    gravity = 32;

    constructor(scene) {
        this.helpers = new THREE.Group();
        scene.add(this.helpers);
    }

    endPhase(collisions, player) {

        collisions.sort((a, b) => {
            return a.overlap < b.overlap;
        });

        for (const collision of collisions) {

            if (!this.pointInPlayerBoundingCylinder(collision.contactPoint, player))
                continue;

            let deltaPosition = collision.normal.clone();
            deltaPosition.multiplyScalar(collision.overlap);
            player.position.add(deltaPosition);

            // Ajustar a velocidade Y se o jogador estiver colidindo com o chão
            if (collision.normal.y > 0) {
                player.velocity.y = 0;
                player.onGround = true;
            } else {
                let magnitude = player.worldVelocity.dot(collision.normal);
                let velocityAdjustment = collision.normal.clone().multiplyScalar(magnitude);
                player.updateWorldVelocity(velocityAdjustment.negate());
            }

        }

    }

    secondPhase(candidates, player, world) {
        const collisions = [];
        const waterBlockId = blockTypeDictionary.get("water").id; 
    
        for (const block of candidates) {
            const p = player.position;
            const closestPoint = {
                x: Math.max(block.x - 0.5, Math.min(p.x, block.x + 0.5)),
                y: Math.max(block.y - 0.5, Math.min(p.y - (player.height / 2), block.y + 0.5)),
                z: Math.max(block.z - 0.5, Math.min(p.z, block.z + 0.5))
            };
    
            const dx = closestPoint.x - player.position.x;
            const dy = closestPoint.y - (player.position.y - (player.height / 2));
            const dz = closestPoint.z - player.position.z;
    
    
            const blockData = world.getBlock(block.x, block.y, block.z);
            if (blockData && blockData.id === waterBlockId) {
                continue; // Ignora colisões com água
            }
    
            if (this.pointInPlayerBoundingCylinder(closestPoint, player)) {
                const overlapY = (player.height / 2) - Math.abs(dy);
                const overlapXZ = player.radius - Math.sqrt(dx * dx + dz * dz);
    
                let normal, overlap;
                if (overlapY < overlapXZ) {
                    normal = new THREE.Vector3(0, -Math.sign(dy), 0);
                    overlap = overlapY;
                    player.onGround = true;
                } else {
                    normal = new THREE.Vector3(-dx, 0, -dz).normalize();
                    overlap = overlapXZ;
                }
    
                collisions.push({
                    block,
                    contactPoint: closestPoint,
                    normal,
                    overlap
                });
            }
        }
        return collisions;
    }

    firstPhase(player, world) {


        const candidates = [];

        const extents = {
            x: {
                min: Math.floor(player.position.x - player.radius),
                max: Math.ceil(player.position.x + player.radius)
            },
            y: {
                min: Math.floor(player.position.y - player.height),
                max: Math.ceil(player.position.y + player.height)
            },
            z: {
                min: Math.floor(player.position.z - player.radius),
                max: Math.ceil(player.position.z + player.radius)
            }
        }

        for (let x = extents.x.min; x <= extents.x.max; x++) {
            for (let y = extents.y.min; y <= extents.y.max; y++) {
                for (let z = extents.z.min; z < extents.z.max; z++) {
                    const blockPos = { x, y, z };
                    const block = world.getBlock(x, y, z);
                    if (block && block.id !== blockTypeDictionary.get("empty").id) {
                        candidates.push(blockPos);
                    }
                }
            }
        }
        return candidates;
    }

    detectCollisions(player, world) {
        player.onGround = false;
        this.helpers.clear();
        const candidates = this.firstPhase(player, world);
        const collisions = this.secondPhase(candidates, player, world);

        if (collisions.length > 0) {
            this.endPhase(collisions, player);
        }
    }

    update(dt, player, world) {
        this.keeper += dt;
        while (this.keeper >= this.timeslice) {
            player.velocity.y -= this.gravity * this.timeslice;
            player.addInputs(this.timeslice);
            player.updateBoxHelper();
            this.detectCollisions(player, world);

            // Atualiza a posição Y apenas se o jogador não estiver no chão
            if (!player.onGround) {
                player.position.y += player.velocity.y * this.timeslice;
            }

            this.keeper -= this.timeslice;
        }
    }

    pointInPlayerBoundingCylinder(p, player) {
        const dx = p.x - player.position.x;
        const dy = p.y - (player.position.y - (player.height / 2));
        const dz = p.z - player.position.z;
        const r = dx * dx + dz * dz;

        return (Math.abs(dy) < player.height / 2) && (r < player.radius * player.radius)
    }
}