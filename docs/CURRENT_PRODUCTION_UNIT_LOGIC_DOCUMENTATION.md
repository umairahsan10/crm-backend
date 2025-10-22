# Current Production Unit Logic Documentation

## Overview
This document captures the current (incorrect) production unit logic before it gets removed and replaced with the new promotion-based approach.

## Current Implementation Analysis

### Current Create Unit Logic (INCORRECT)
**File:** `src/modules/production/units/units.service.ts` - `createUnit()` method

**Current Flow:**
1. Validates `headId` if provided
2. Checks if employee exists
3. Validates employee has `unit_head` role
4. Checks if employee is already head of another unit
5. Creates unit with headId

**Problems with Current Logic:**
- ❌ Requires employee to already have `unit_head` role
- ❌ No promotion logic
- ❌ No team lead replacement
- ❌ No role changes
- ❌ No team reassignment

### Current Update Unit Logic (INCORRECT)
**File:** `src/modules/production/units/units.service.ts` - `updateUnit()` method

**Current Flow:**
1. Validates unit exists
2. Role-based access control
3. Validates headId if provided
4. Checks if employee has `unit_head` role
5. Updates unit

**Problems with Current Logic:**
- ❌ No promotion scenarios
- ❌ No team lead replacement
- ❌ No role transitions
- ❌ Static role assignment only

### Current DTOs (INCORRECT)
**Files:** 
- `src/modules/production/units/dto/create-unit.dto.ts`
- `src/modules/production/units/dto/update-unit.dto.ts`

**Current Structure:**
```typescript
// CreateProductionUnitDto
{
  name: string;
  headId?: number; // Optional, but requires unit_head role
}

// UpdateProductionUnitDto  
{
  name?: string;
  headId?: number; // Optional, but requires unit_head role
}
```

**Problems:**
- ❌ No promotion parameters
- ❌ No newTeamLeadId field
- ❌ No scenario differentiation
- ❌ No role transition support

### Current Controller (INCORRECT)
**File:** `src/modules/production/units/units.controller.ts`

**Current Endpoints:**
- `POST /production/units` - Create unit (incorrect logic)
- `GET /production/units` - Get units (this is fine)
- `PATCH /production/units/:id` - Update unit (incorrect logic)
- `DELETE /production/units/:id` - Delete unit (this is fine)
- `GET /production/units/available-heads` - Get available heads (incorrect logic)

**Problems:**
- ❌ No promotion endpoints
- ❌ No team lead replacement logic
- ❌ No role transition support

## What Needs to be Removed

### Files to be Completely Rewritten:
1. `src/modules/production/units/units.service.ts` - Remove all methods except `getAllUnits()` and `getUnit()`
2. `src/modules/production/units/units.controller.ts` - Remove create, update, available-heads endpoints
3. `src/modules/production/units/dto/create-unit.dto.ts` - Complete rewrite
4. `src/modules/production/units/dto/update-unit.dto.ts` - Complete rewrite

### Methods to Remove:
- `createUnit()` - Wrong logic
- `updateUnit()` - Wrong logic  
- `getAvailableHeads()` - Wrong logic
- All validation methods for current approach

### Methods to Keep:
- `getAllUnits()` - This is correct
- `getUnit()` - This is correct
- `deleteUnit()` - This is correct

## New Approach Requirements

### New DTO Structure Needed:
```typescript
// For team lead promotion scenario
{
  name: string;
  headId: number; // Current team lead
  newTeamLeadId: number; // Senior/junior to become new team lead
}

// For direct promotion scenario  
{
  name: string;
  headId: number; // Senior/junior to become unit head
}
```

### New Logic Required:
1. **Role Validation:** Check if headId is team_lead (scenario 1) or senior/junior (scenario 2)
2. **Promotion Logic:** Change roles appropriately
3. **Team Reassignment:** Assign new team lead to original team
4. **Unit Creation:** Create new unit with promoted employee
5. **Audit Logging:** Log all role changes and promotions

## Conclusion
The current implementation is fundamentally flawed because it assumes employees already have the correct roles, rather than supporting the promotion workflow that's actually needed in the business process.

The new approach will support:
- ✅ Team lead promotion to unit head
- ✅ Automatic team lead replacement
- ✅ Role transitions
- ✅ Team reassignment
- ✅ Audit logging
- ✅ Project continuity
