#!/usr/bin/env python3
"""
Knowledge Base Seed Script

Populates TayAI with comprehensive, accurate hair education and business
mentorship content. This content is used by the RAG system to provide
expert-level advice.

Usage:
    python scripts/seed_knowledge_base.py
    python scripts/seed_knowledge_base.py --dry-run
    python scripts/seed_knowledge_base.py --category hair
"""
import argparse
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.services.knowledge_service import KnowledgeService
from app.schemas.knowledge import KnowledgeBaseCreate


# =============================================================================
# HAIR EDUCATION - Foundations
# =============================================================================

HAIR_FOUNDATIONS = [
    {
        "title": "Understanding Hair Porosity - Complete Guide",
        "category": "hair_education",
        "content": """Hair porosity determines how your hair absorbs and retains moisture. Understanding your porosity is essential for choosing the right products and techniques.

## What is Hair Porosity?

Porosity refers to your hair's ability to absorb and hold moisture, determined by the condition of your cuticle layer (the outermost layer of the hair shaft).

## The Three Porosity Types

### Low Porosity Hair
**Characteristics:**
- Cuticles are tightly closed and lay flat
- Water beads up on hair rather than absorbing quickly
- Takes a long time to get fully wet in the shower
- Products tend to sit on top of hair (buildup prone)
- Takes longer to dry
- Often shiny when healthy

**Best Practices:**
- Use lightweight, water-based products
- Apply products to damp, warm hair (heat opens cuticles)
- Use a hooded dryer or steam for deep conditioning
- Clarify regularly to prevent buildup
- Avoid heavy butters and oils as leave-ins
- Best oils: Argan, grapeseed, sweet almond (lightweight)
- Use the LCO method (Liquid, Cream, Oil)

**Products to Avoid:**
- Heavy butters as leave-ins
- Protein-heavy products (can cause stiffness)
- Thick creams that sit on hair

### Medium/Normal Porosity Hair
**Characteristics:**
- Cuticles are slightly raised
- Absorbs and retains moisture well
- Holds styles well
- Accepts color easily
- Generally easy to maintain

**Best Practices:**
- Maintain balance with regular conditioning
- Occasional protein treatments (monthly)
- Most products work well
- Deep condition every 1-2 weeks

### High Porosity Hair
**Characteristics:**
- Cuticles are raised or damaged (gaps and holes)
- Absorbs moisture very quickly
- Loses moisture just as fast
- Often feels dry despite moisturizing
- Tangles easily
- Usually from damage (heat, chemical, environmental)

**Best Practices:**
- Use heavier creams and butters to seal moisture
- Regular protein treatments to fill gaps
- Apple cider vinegar rinses to help close cuticles
- Use the LOC method (Liquid, Oil, Cream)
- Layer products to lock in moisture
- Sleep on satin/silk to reduce friction
- Seal with heavier oils: Castor, olive, avocado

## How to Test Your Porosity

### Float Test
1. Take a few clean, shed hairs (no product)
2. Drop into a glass of room temperature water
3. Wait 2-4 minutes
4. Results:
   - Floats at top = Low porosity
   - Sinks slowly to middle = Medium porosity
   - Sinks quickly to bottom = High porosity

### Spray Test
1. Spray water on a section of clean hair
2. Observe:
   - Water beads up = Low porosity
   - Absorbs gradually = Medium porosity
   - Absorbs immediately = High porosity

### Slide Test
1. Take a strand and slide fingers up toward scalp
2. Feel:
   - Smooth = Low porosity
   - Slight bumps = Medium porosity
   - Rough/bumpy = High porosity

**Note:** Porosity can vary in different areas of your head and can change with damage or treatments."""
    },
    {
        "title": "Hair Typing System - Understanding Your Curl Pattern",
        "category": "hair_education",
        "content": """The Andre Walker Hair Typing System categorizes hair into types 1-4 with subcategories A, B, and C. While porosity matters more for product selection, knowing your type helps with styling techniques.

## Type 1: Straight Hair
- 1A: Very straight, fine, soft
- 1B: Straight with slight body, medium texture
- 1C: Straight with coarse texture

## Type 2: Wavy Hair
- 2A: Loose S-waves, fine texture
- 2B: More defined S-waves, medium texture
- 2C: Well-defined waves, can be frizzy

## Type 3: Curly Hair
- 3A: Loose spiral curls (sidewalk chalk size)
- 3B: Springy ringlets (marker size)
- 3C: Tight corkscrews (pencil/straw size)

## Type 4: Coily/Kinky Hair
- 4A: Defined S-pattern coils (crochet needle size)
- 4B: Z-pattern, less defined, zigzag shape
- 4C: Tightest coils, may appear patternless, significant shrinkage (up to 75%)

## Important Notes

**Hair typing is just ONE factor.** More important factors:
1. **Porosity** - How hair absorbs moisture
2. **Density** - How many strands you have
3. **Width/Texture** - Fine, medium, or coarse strands
4. **Elasticity** - How much hair stretches before breaking

**Most people have multiple types** on their head. The crown, nape, and edges often have different patterns.

## Caring for Type 4 Hair (Most Common Questions)

### 4C Hair Specific Tips
- Shrinkage is normal and healthy (shows elasticity)
- Detangle ONLY when wet with lots of conditioner
- Finger detangle first, then wide-tooth comb
- Never brush dry 4C hair
- Protective styles help retain length
- Moisturize frequently (every 2-3 days minimum)
- Seal moisture with oil or butter
- Sleep on satin/silk always
- Trim regularly to prevent single-strand knots

### Preventing Breakage in Type 4 Hair
- Low manipulation is key
- Avoid tight styles at the edges
- Don't leave protective styles in too long (max 6-8 weeks)
- Keep hair moisturized - dryness causes breakage
- Be patient - growth happens, but shrinkage hides it"""
    },
    {
        "title": "The LOC and LCO Methods - Moisture Layering Guide",
        "category": "hair_education",
        "content": """The LOC (Liquid, Oil, Cream) and LCO (Liquid, Cream, Oil) methods are moisture layering techniques that help natural hair retain hydration. The order matters based on your porosity.

## Understanding the Concept

The goal is to:
1. **Hydrate** the hair with water/liquid
2. **Moisturize** with cream-based products
3. **Seal** to prevent moisture loss

## LOC Method (Liquid → Oil → Cream)

**Best for: High Porosity Hair**

Why it works: High porosity hair loses moisture quickly. Applying oil after liquid helps slow down moisture escape, then cream provides additional moisture and hold.

### Steps:
1. **L - Liquid/Leave-in**
   - Start with damp hair or spray with water
   - Apply water-based leave-in conditioner
   - Examples: Aloe vera juice, rose water, water-based leave-in

2. **O - Oil**
   - Apply oil to seal in the water
   - Best oils for high porosity: Castor oil, olive oil, avocado oil
   - Focus on ends and dry areas

3. **C - Cream**
   - Apply moisturizing cream or butter
   - Provides additional moisture and helps with styling
   - Examples: Shea butter, curl creams

## LCO Method (Liquid → Cream → Oil)

**Best for: Low Porosity Hair**

Why it works: Low porosity hair has difficulty absorbing products. Applying cream before oil allows moisture to penetrate, then a light oil seals without heavy buildup.

### Steps:
1. **L - Liquid/Leave-in**
   - Apply to damp, warm hair (warmth opens cuticles)
   - Use lightweight, water-based products
   - Avoid products with heavy oils at the top of ingredient list

2. **C - Cream**
   - Apply lightweight cream while hair is still damp
   - Look for water as first ingredient
   - Avoid heavy butters

3. **O - Oil**
   - Seal with a LIGHT oil
   - Best oils: Argan, grapeseed, jojoba, sweet almond
   - Use sparingly - a little goes a long way

## Product Recommendations by Porosity

### Low Porosity
- Leave-in: Water-based sprays, aloe-based products
- Cream: Lightweight curl creams (avoid shea butter as main ingredient)
- Oil: Argan, grapeseed, jojoba (2-3 drops max)

### High Porosity
- Leave-in: Creamy leave-ins with slip
- Oil: Castor oil, olive oil, JBCO (Jamaican Black Castor Oil)
- Cream: Shea butter-based creams, heavy curl creams

## Pro Tips

1. **Less is more** - Start with small amounts, add if needed
2. **Apply to soaking wet hair** for best absorption
3. **Section your hair** for even distribution
4. **Refresh midweek** with water and a light oil
5. **Adjust based on results** - if hair feels greasy, use less product
6. **Climate matters** - Humid climates may need less product

## Signs You're Using the Wrong Method

**Too much moisture/product:**
- Hair feels mushy or gummy
- Limp, lifeless curls
- Takes forever to dry
- Product flaking

**Not enough moisture:**
- Hair feels dry and brittle
- Excessive frizz
- Breakage
- Dull appearance"""
    },
    {
        "title": "Wash Day Routine - Step by Step Guide",
        "category": "hair_education",
        "content": """A proper wash day routine is the foundation of healthy natural hair. This comprehensive guide covers each step for optimal results.

## Before You Start

**Gather your supplies:**
- Wide-tooth comb or detangling brush
- Clips for sectioning
- Pre-poo oil or conditioner
- Clarifying shampoo (for monthly use)
- Moisturizing shampoo or co-wash
- Deep conditioner
- Leave-in conditioner
- Styling products
- Microfiber towel or t-shirt
- Heat cap or plastic cap (for deep conditioning)

## Step 1: Pre-Poo (Pre-Shampoo Treatment)

**Purpose:** Protect hair from stripping during shampoo, add slip for detangling

**How to:**
1. Section hair into 4-8 parts
2. Apply oil or conditioner to each section
3. Gently finger detangle
4. Leave for 15-30 minutes (or overnight with a cap)

**Best pre-poo options:**
- Coconut oil (penetrates the hair shaft)
- Olive oil
- Conditioner mixed with oil
- Avocado oil

## Step 2: Shampoo/Cleanse

**Clarifying Shampoo (Monthly):**
- Removes product buildup, hard water minerals
- Use when hair feels coated or products aren't working
- Follow with deep conditioning - it can be drying

**Moisturizing Shampoo (Weekly):**
- Sulfate-free recommended
- Cleanses without stripping
- Focus on SCALP, not lengths

**Co-Wash (Between Shampoos):**
- Conditioner-only wash
- Good for dry hair types
- Still need to shampoo periodically

**Technique:**
1. Focus shampoo on the scalp
2. Use fingertips (not nails) to massage
3. Let suds run down the length
4. Rinse thoroughly with lukewarm water
5. Repeat if needed

## Step 3: Deep Condition

**Purpose:** Restore moisture, strengthen hair, improve elasticity

**How to:**
1. Apply generously to clean, damp hair
2. Focus on mid-lengths and ends
3. Use a wide-tooth comb to distribute
4. Cover with plastic cap
5. Add heat (hooded dryer, steam, or hot towel) for 20-30 minutes
6. Rinse with cool water to seal cuticles

**Choosing a Deep Conditioner:**
- **Moisture-based:** For dry, brittle hair (look for: glycerin, honey, aloe)
- **Protein-based:** For damaged, weak hair (look for: keratin, silk amino acids)
- **Balanced:** For maintenance (has both moisture and protein)

**How often:**
- Weekly for most natural hair
- After every wash for damaged hair
- Every 2 weeks for healthy, low maintenance hair

## Step 4: Leave-In Conditioner

**Purpose:** Provide lasting moisture, detangle, prep for styling

**Application:**
1. Apply to soaking wet hair (don't towel dry first)
2. Section and apply from ends to roots
3. Use praying hands method or raking
4. Detangle gently with fingers or wide-tooth comb

## Step 5: Style

Apply your styling products using LOC or LCO method based on porosity.

**Styling Tips:**
- Work in sections
- Apply products to wet hair
- Use the "praying hands" method to smooth
- Scrunch for curl definition
- Don't touch hair while drying

## Step 6: Dry

**Air Dry:**
- Longest but most gentle method
- Good for: Low manipulation, heat-free routine
- Tip: Don't touch hair until fully dry

**Diffuse:**
- Faster than air dry
- Adds volume
- Use low heat, low speed
- Cup curls, don't rub

**Hooded Dryer:**
- Even heat distribution
- Good for: Sets, roller sets, deep conditioning
- Use low-medium heat

## Wash Day Schedule by Hair Type

**High Porosity:** Wash every 5-7 days
**Low Porosity:** Wash every 7-10 days
**Type 4 Hair:** Every 7-14 days (overwashing causes dryness)

## Common Wash Day Mistakes

1. **Using hot water** - Strips moisture, use lukewarm
2. **Rough towel drying** - Causes frizz and breakage
3. **Skipping deep conditioning** - Hair needs regular deep moisture
4. **Detangling dry hair** - Always detangle wet with conditioner
5. **Not sectioning** - Leads to tangles and uneven product distribution
6. **Too much product** - Causes buildup, weigh hair down"""
    },
    {
        "title": "Protein-Moisture Balance - Preventing Breakage",
        "category": "hair_education",
        "content": """Understanding the protein-moisture balance is crucial for preventing breakage and maintaining healthy hair. Imbalance is one of the most common causes of hair problems.

## What is Protein-Moisture Balance?

Hair needs both:
- **Protein:** Provides strength, structure, and elasticity
- **Moisture:** Provides flexibility, softness, and hydration

Too much of either causes problems. The goal is balance.

## Signs of Protein Overload

Your hair has TOO MUCH protein if:
- Hair feels stiff, straw-like, or brittle
- Hair snaps easily with little stretch
- Excessive breakage despite moisturizing
- Hair feels rough and dry
- Curls are limp or stringy
- Hair tangles more than usual

**Fix:** Stop all protein products, focus on moisture:
- Deep condition with moisture-only products
- Use glycerin-based products
- Apple cider vinegar rinse can help
- Takes 2-4 weeks to rebalance

## Signs of Moisture Overload (Hygral Fatigue)

Your hair has TOO MUCH moisture if:
- Hair feels mushy, gummy, or overly soft
- Hair stretches too much and doesn't bounce back
- Curls are limp, won't hold definition
- Hair feels weak and breaks easily
- Hair takes forever to dry
- Increased shedding

**Fix:** Add protein:
- Use a protein treatment (light to start)
- Look for products with: hydrolyzed keratin, silk protein, wheat protein
- Reduce moisture-heavy products temporarily
- Takes 1-2 weeks to rebalance

## Finding Your Balance

### The Strand Test
1. Take a wet strand of hair
2. Gently stretch it
3. Observe:
   - **Healthy:** Stretches slightly, bounces back
   - **Needs protein:** Stretches a lot, doesn't return, breaks
   - **Needs moisture:** Barely stretches, snaps immediately

### Protein Treatment Schedule

**Normal/Healthy Hair:** Monthly protein treatment
**Damaged/High Porosity:** Every 2 weeks
**Low Porosity:** Every 6-8 weeks (less frequent)
**Color-Treated:** Every 2-3 weeks

### Types of Protein Treatments

**Light Protein:**
- Good for: Maintenance, low porosity hair
- Ingredients: Silk amino acids, wheat protein
- Frequency: Every 2-4 weeks

**Medium Protein:**
- Good for: Regular maintenance, medium porosity
- Ingredients: Hydrolyzed keratin, collagen
- Frequency: Monthly

**Heavy Protein (Reconstructors):**
- Good for: Severely damaged hair, emergency repair
- Ingredients: Hydrolyzed keratin, Aphogee-type treatments
- Frequency: Only when needed, every 6-8 weeks max
- Always follow with deep moisture treatment

## Protein-Sensitive Hair

Some people's hair reacts poorly to protein. Signs:
- Any amount of protein causes stiffness
- Hair feels worse after protein treatments
- Usually fine or low porosity hair

**If protein-sensitive:**
- Avoid products with protein in first 5 ingredients
- Look for protein-free deep conditioners
- Focus on humectants (glycerin, honey) instead

## Building a Balanced Routine

**Weekly Rotation Example:**
- Week 1: Moisture deep conditioner
- Week 2: Moisture deep conditioner  
- Week 3: Protein treatment
- Week 4: Moisture deep conditioner

**Product Stacking:**
- Daily products: Moisture-focused
- Weekly: Deep moisture conditioning
- Monthly: Protein treatment
- Quarterly: Clarify + protein + deep moisture

## Quick Reference

| Symptom | Likely Issue | Solution |
|---------|--------------|----------|
| Brittle, snaps easily | Protein overload | Moisture treatments |
| Mushy, overly stretchy | Moisture overload | Protein treatment |
| Dry but breaks when pulled | Needs both | Balanced deep conditioner |
| Healthy stretch and bounce | Balanced | Maintain routine |"""
    },
]

# =============================================================================
# HAIR EDUCATION - Styling
# =============================================================================

HAIR_STYLING = [
    {
        "title": "Twist Out Tutorial - Perfect Definition Every Time",
        "category": "hair_styling",
        "content": """The twist out is a classic natural hairstyle that creates beautiful, defined curls and waves. Here's how to achieve consistent, long-lasting results.

## What You'll Need

- Leave-in conditioner
- Twisting cream or butter
- Gel or setting lotion (optional, for hold)
- Water spray bottle
- Wide-tooth comb
- Clips for sectioning
- Satin scarf or bonnet

## Step-by-Step Process

### Step 1: Start with Clean, Conditioned Hair
- Best results on freshly washed hair
- Or dampen dry hair thoroughly with water

### Step 2: Section Hair
- Divide into 4-8 large sections
- Clip each section
- Smaller sections = more defined curls
- Larger sections = looser waves

### Step 3: Apply Products
For each section:
1. Spray with water if needed (should be damp, not soaking)
2. Apply leave-in conditioner
3. Apply twisting cream/butter
4. For more hold, add gel

**Product amount:** Start with less, add more if needed

### Step 4: Create Twists

1. Take a small section (pencil-width for tight curls, finger-width for waves)
2. Split into two equal strands
3. Twist strands around each other from root to end
4. Twist in the SAME direction the entire length
5. Twirl the end around your finger to secure
6. Continue until all hair is twisted

**Twist Direction:** 
- Twist AWAY from your face for a more flattering look
- Be consistent with direction throughout

### Step 5: Dry Completely

**This is the most important step!**

Options:
- Air dry overnight (8+ hours)
- Sit under hooded dryer (1-2 hours)
- Diffuse on low heat

**Hair MUST be 100% dry before unraveling. Wet hair = frizz.**

### Step 6: Unravel

1. Apply a small amount of oil to your fingers
2. Remove one twist at a time
3. Gently unravel from the bottom up
4. Separate each twist into 2-3 sections
5. DO NOT over-separate (causes frizz)

### Step 7: Style

- Fluff at the roots for volume
- Shape with your fingers
- Use a pick for more volume (carefully)
- Apply a light oil for shine if needed

## Twist Out Troubleshooting

### Problem: Frizzy Results
**Causes:**
- Unraveled before fully dry
- Over-manipulated when unraveling
- Too much product
- Hair was too dry when twisting

**Fix:**
- Wait until 100% dry
- Use oil on fingers when unraveling
- Don't over-separate

### Problem: No Definition
**Causes:**
- Twists were too big
- Not enough product
- Products don't work for your hair

**Fix:**
- Make smaller twists
- Add gel for hold
- Try different products

### Problem: Twists Unravel
**Causes:**
- Didn't twist tight enough
- Ends not secured
- Products too slippery

**Fix:**
- Twist tighter (but not too tight at scalp)
- Twirl ends or use perm rods on ends
- Use gel on ends to secure

### Problem: Flat/No Volume
**Causes:**
- Twists too big
- Heavy products
- Didn't fluff at roots

**Fix:**
- Smaller sections = more volume
- Lighter products
- Use a pick at roots
- Consider doing twists on stretched hair

## Maintaining Your Twist Out

**Night Routine:**
1. Pineapple method (high loose ponytail) OR
2. Re-twist a few sections OR
3. Use a satin bonnet/scarf

**Refreshing:**
- Day 2-3: Spritz with water/leave-in mix, scrunch
- Day 4-5: Re-twist any frizzy sections
- Day 7+: Re-do entirely or try different style

**Longevity:** A good twist out can last 5-7 days with proper maintenance.

## Product Recommendations by Hair Type

**Fine/Low Porosity:**
- Light leave-in spray
- Mousse or light cream
- Light gel

**Medium Texture:**
- Creamy leave-in
- Medium-hold cream
- Optional gel

**Thick/High Porosity:**
- Rich leave-in
- Butter or heavy cream
- Gel or custard for hold"""
    },
    {
        "title": "Protective Styling Guide - Length Retention",
        "category": "hair_styling",
        "content": """Protective styles keep your ends tucked away and minimize manipulation, promoting length retention and reducing breakage. Here's how to do them safely.

## What Makes a Style "Protective"?

A true protective style:
- Tucks ends away from friction and elements
- Requires low daily manipulation
- Doesn't put tension on edges or hairline
- Allows you to maintain moisture

## Popular Protective Styles

### Box Braids
**Duration:** 6-8 weeks maximum
**Best for:** All hair types

**Pros:**
- Very low maintenance
- Versatile styling options
- Allows scalp access for moisturizing

**Cons:**
- Can be heavy
- Tension on hairline if too tight
- Takes several hours to install

**Care Tips:**
- Don't install too tight
- Moisturize scalp every 2-3 days
- Wrap at night with satin scarf
- Don't leave in longer than 8 weeks

### Knotless Braids
**Duration:** 6-8 weeks maximum

**Pros:**
- Less tension than traditional box braids
- Lighter weight
- More natural look at roots
- Better for sensitive scalps/edges

**Cons:**
- Takes longer to install
- May cost more
- Can still be heavy if too much hair added

### Twists (Senegalese/Marley/Passion)
**Duration:** 4-6 weeks

**Pros:**
- Usually lighter than braids
- Faster installation
- Easy to do yourself

**Cons:**
- May not last as long as braids
- Can frizz faster
- More prone to unraveling

### Wigs
**Duration:** Daily wear

**Pros:**
- Zero tension on hair (if worn correctly)
- Complete protection
- Change styles without commitment
- Easy access to natural hair

**Cons:**
- Can cause hairline damage if glued
- May be hot
- Requires proper underneath care

**Safe Wig Practices:**
- Use wig caps that don't pull edges
- Avoid glue on hairline (use bands or clips)
- Braid or twist natural hair underneath
- Moisturize natural hair regularly
- Give scalp breaks

### Crochet Styles
**Duration:** 4-6 weeks

**Pros:**
- Quick installation
- Lightweight
- Versatile looks

**Cons:**
- Cornrow base required
- Can be bulky
- Limited scalp access

## Protective Styling Do's and Don'ts

### DO:
✓ Moisturize natural hair before installing
✓ Deep condition before installation
✓ Keep scalp clean (diluted shampoo or witch hazel)
✓ Moisturize while style is in
✓ Wrap hair at night
✓ Give hair breaks between styles
✓ Trim ends if needed when removing

### DON'T:
✗ Install too tight (causes traction alopecia)
✗ Leave styles in too long
✗ Neglect your natural hair underneath
✗ Skip the prep/deep conditioning
✗ Use heavy products that cause buildup
✗ Pull or snatch when removing

## How Long to Keep Protective Styles

| Style | Maximum Duration |
|-------|------------------|
| Box Braids | 6-8 weeks |
| Knotless Braids | 6-8 weeks |
| Twists | 4-6 weeks |
| Crochet | 4-6 weeks |
| Sew-in Weave | 6-8 weeks |
| Wigs | Daily (remove at night) |

**Signs to Remove Early:**
- Excessive frizz at roots
- Matting at roots
- Itchy, irritated scalp
- New growth causing tension
- Style looks unkempt

## Caring for Hair Between Protective Styles

**The 1-2 Week Break:**
1. Gently remove style (don't rip)
2. Finger detangle with oil
3. Clarifying wash
4. Deep condition for 30+ minutes
5. Protein treatment if needed
6. Moisturize and style
7. Wait at least 1-2 weeks before next protective style

## Edge Protection

**How to Protect Your Edges:**
- Never install styles too tight at the hairline
- Don't repeatedly style hair in same direction
- Apply edge control sparingly
- Use a soft brush, not hard bristles
- Give edges a break from tension styles

**Signs of Traction Alopecia:**
- Thinning at hairline
- Small bumps along hairline
- Pain when wearing styles
- Broken hairs at edges

**If you notice these signs, stop protective styling immediately and see a dermatologist.**"""
    },
    {
        "title": "Heat Styling Safely - Silk Press and Flat Iron Guide",
        "category": "hair_styling",
        "content": """Heat styling can be done safely when proper precautions are taken. Here's how to achieve sleek styles while minimizing damage.

## Silk Press vs Regular Flat Iron

### Silk Press
- Uses tension from blow drying + flat iron
- Hair has more movement and body
- Shinier, silkier finish
- Should revert after washing

### Regular Flat Iron
- Just flat iron application
- Can look flatter
- Easier to do at home

## Preparing for Heat Styling

### 1. Start with Clean Hair
- Clarify to remove all buildup (important!)
- Buildup + heat = damage
- Use a clarifying shampoo

### 2. Deep Condition
- Essential before any heat
- Provides moisture barrier
- Use a moisturizing deep conditioner

### 3. Use Heat Protectant (NON-NEGOTIABLE)
- Apply to DAMP hair before blow drying
- Reapply to each section before flat ironing
- Look for protectants that can withstand your heat setting

**Key Ingredients in Heat Protectants:**
- Silicones (dimethicone) - creates barrier
- Proteins - strengthen hair
- Humectants - maintain moisture

## Heat Settings by Hair Type

**Fine Hair:** 250-300°F (120-150°C)
**Medium Hair:** 300-380°F (150-190°C)
**Coarse Hair:** 380-400°F (190-200°C)

**NEVER exceed 450°F** - causes permanent damage

## Silk Press Step-by-Step

### Step 1: Blow Dry
1. Section hair into 4-6 parts
2. Apply heat protectant to each section
3. Use a concentrator nozzle
4. Use comb-chase method (comb follows dryer)
5. Dry in the direction of growth (roots to ends)
6. Get hair about 90% straight
7. Allow hair to cool

### Step 2: Flat Iron
1. Section hair into small parts (thin sections!)
2. Apply additional heat protectant
3. Comb through section
4. Place flat iron at roots
5. Pass through with steady tension
6. ONE OR TWO PASSES MAX per section
7. Let each section cool before touching

**Technique Tips:**
- Don't clamp too hard
- Move at steady speed (not too slow, not too fast)
- Keep plates clean
- Don't go over the same section repeatedly

### Step 3: Finish
- Apply light serum or oil for shine
- Use a light holding spray if desired
- Don't touch excessively

## How to Make Your Silk Press Last

**Do:**
- Wrap hair at night with satin scarf
- Avoid humidity (no working out, rain, steam)
- Sleep on satin pillowcase
- Touch up only edges if needed

**Don't:**
- Use heavy products
- Exercise heavily (sweat = reversion)
- Get hair wet

**Duration:** A good silk press can last 2-3 weeks

## Signs of Heat Damage

**Indicators:**
- Hair won't curl back after washing
- Straight pieces mixed with curly
- Ends look stringy or feel limp
- Excessive breakage
- Split ends
- Change in texture

**Heat Damage is Permanent**
The damaged portion must be cut off. Prevention is key.

## Preventing Heat Damage

1. **Limit heat styling** - Max once a month, preferably less
2. **Always use heat protectant**
3. **Never use high heat repeatedly**
4. **Keep flat iron moving** - Don't hold in one spot
5. **Make sure hair is dry** - Wet hair + heat = steam damage
6. **Use quality tools** - Cheap irons have uneven heat
7. **Don't skip the prep** - Clarify and condition first

## What to Do If You Have Heat Damage

1. **Assess the damage** - How much is affected?
2. **Stop all heat immediately**
3. **Trim the damaged ends**
4. **Deep condition regularly** - You can't "fix" damage, but you can manage it
5. **Consider a big chop** - For extensive damage
6. **Be patient** - Healthy hair will grow in"""
    },
]

# =============================================================================
# BUSINESS MENTORSHIP
# =============================================================================

BUSINESS_MENTORSHIP = [
    {
        "title": "Starting Your Hair Business - Complete Guide",
        "category": "business_mentorship",
        "content": """Ready to turn your passion into profit? Here's a comprehensive guide to starting your hair business the right way.

## Types of Hair Businesses

### Service-Based
- **Salon Suite Owner:** Rent a suite in a salon complex
- **Home-Based Stylist:** Work from home (check local regulations)
- **Mobile Stylist:** Go to clients' locations
- **Salon Owner:** Full salon ownership

### Product-Based
- **Hair Care Line:** Create your own products
- **Hair Extensions/Wigs:** Sell hair pieces
- **Tools/Accessories:** Sell styling tools

### Education-Based
- **Online Courses:** Teach hair techniques
- **Workshops:** In-person training
- **Content Creation:** YouTube, social media

## Legal Requirements

### Licenses Needed
1. **Cosmetology License** (required in most states to touch hair)
   - Complete cosmetology school
   - Pass state board exam
   - Renew as required (usually every 2 years)

2. **Business License**
   - Apply through your city/county
   - Cost varies by location

3. **Seller's Permit** (if selling products)
   - Register with state
   - Collect sales tax

### Business Structure Options

| Structure | Pros | Cons |
|-----------|------|------|
| Sole Proprietorship | Easy to start | Personal liability |
| LLC | Liability protection | More paperwork |
| S-Corp | Tax benefits | Most complex |

**Recommendation:** LLC is best for most stylists - protects personal assets.

### Insurance You Need
- **General Liability:** Protects against accidents
- **Professional Liability:** Protects against service claims
- **Property Insurance:** If you have a space
- **Product Liability:** If selling products

**Typical cost:** $300-$1000/year for basic coverage

## Setting Up Your Business

### Step 1: Create a Business Plan
- Define your niche (who do you serve?)
- Identify your services
- Set pricing
- Financial projections
- Marketing plan

### Step 2: Set Up Finances
- Open business bank account (separate from personal!)
- Get business credit card
- Choose accounting software (Wave is free, QuickBooks is popular)
- Set aside 25-30% of income for taxes

### Step 3: Build Your Brand
- Business name (check availability)
- Logo and colors
- Brand voice and personality
- Professional photos

### Step 4: Create Your Online Presence
- Website (even simple one)
- Instagram (essential for stylists)
- Google Business Profile (for local search)
- Booking system

## Startup Costs to Expect

### Booth Rental Model
- First/last month rent: $800-3000
- Tools and equipment: $500-2000
- Products: $500-1000
- Business setup: $300-500
- Marketing: $200-500
- **Total: $2,300-$7,000**

### Salon Suite
- First month + deposit: $1500-5000
- Equipment: $2000-5000
- Products: $500-1000
- Business setup: $300-500
- Marketing: $500-1000
- **Total: $4,800-$12,500**

### Home-Based
- Home setup/equipment: $500-2000
- Products: $300-500
- Business setup: $300-500
- Marketing: $200-500
- **Total: $1,300-$3,500**

## Common Mistakes to Avoid

1. **Underpricing services** - Know your worth!
2. **No contracts** - Always have policies in writing
3. **Mixing personal and business money**
4. **No emergency fund** - Save 3-6 months expenses
5. **Ignoring taxes** - Set aside 25-30%
6. **Not tracking expenses** - Track everything
7. **Trying to serve everyone** - Pick a niche

## Your First Year: Realistic Expectations

**Months 1-3:** Building foundation
- Getting your first clients
- Learning business operations
- Mostly investing, little profit

**Months 4-6:** Growing
- Word of mouth starting
- Social media gaining traction
- Should break even or small profit

**Months 7-12:** Establishing
- Consistent clientele developing
- Referrals increasing
- Should be profitable

**Be patient.** Most businesses take 1-2 years to become stable."""
    },
    {
        "title": "Pricing Your Services - Stop Undercharging",
        "category": "business_mentorship",
        "content": """Pricing is where most stylists struggle. Here's how to price your services profitably and confidently.

## The Pricing Formula

**Service Price = Time Cost + Product Cost + Overhead + Profit Margin**

### Step 1: Calculate Your Time Cost

**Determine your hourly rate:**

1. Desired annual income: $___
2. Divide by working weeks (50): $___/week
3. Divide by working hours (35): $___/hour

**Example:**
- Want to make $60,000/year
- $60,000 ÷ 50 weeks = $1,200/week
- $1,200 ÷ 35 hours = $34/hour minimum

### Step 2: Add Product Cost

Track how much product you use per service:
- Shampoo/conditioner
- Styling products
- Color (if applicable)
- Disposables

**Example:** Typical style uses $5-15 in products

### Step 3: Calculate Overhead

Monthly overhead costs divided by services:
- Rent/booth rental
- Utilities
- Insurance
- Tools/equipment (amortized)
- Marketing
- Software/subscriptions
- Continuing education

**Example:** 
- Monthly overhead: $1,500
- Services per month: 60
- Overhead per service: $25

### Step 4: Add Profit Margin

Add 20-40% on top for:
- Business growth
- Taxes
- Emergencies
- Your expertise

## Sample Pricing Calculation

**Service: Natural Hair Silk Press (3 hours)**

| Component | Calculation | Amount |
|-----------|-------------|--------|
| Time | 3 hours × $34/hr | $102 |
| Products | Shampoo, conditioner, heat protectant | $12 |
| Overhead | $25/service | $25 |
| Subtotal | | $139 |
| Profit (30%) | | $42 |
| **Total Price** | | **$181** |

Round up: **$185 or $195**

## Pricing Psychology

### Price Anchoring
- Always present highest package first
- Makes mid-tier seem reasonable

### Avoid Awkward Numbers
- $75 feels lower than $73
- $100 vs $97 - go with the round number
- Project confidence

### Package Services
Instead of:
- Wash: $30
- Style: $45
- Treatment: $25

Offer:
- Complete Style Experience: $85 (saves $15)

## When to Raise Prices

**Raise prices when:**
- Booked solid 4+ weeks out
- Skills have significantly improved
- Your costs increased
- It's been over a year
- You're exhausted and undervalued

**How to raise prices:**
1. Give 30-60 days notice
2. Communicate value (new training, better products)
3. Raise new clients immediately, give existing clients grace period
4. Don't apologize - you're worth it

## Handling Price Objections

**"That's expensive"**
- "I understand. Quality work and products require investment. Would you like to discuss what's included?"

**"My last stylist charged less"**
- "Every stylist has different experience levels and overhead. My pricing reflects my training, quality products, and the experience you receive."

**"Can I get a discount?"**
- "I appreciate you asking, but my prices are set to ensure I can provide you with the best service and products. I'd love to have you as a client at my regular rate."

**Don't negotiate your prices down.** If someone can't afford you, they're not your ideal client.

## Common Pricing Mistakes

1. **Pricing based on others** - Your costs and value are different
2. **Forgetting overhead** - Every service must cover business costs
3. **Emotional pricing** - Don't let fear set your prices
4. **Not raising prices** - Costs go up, so should prices
5. **Discounting too often** - Devalues your work
6. **Charging by time only** - Charge for expertise too

## Price List Best Practices

- Have printed/digital price list ready
- Include "starting at" for variable services
- Update regularly
- Be transparent about what's included
- Add upgrade options

**Example Format:**
```
SILK PRESS
Starting at $150
Includes: Shampoo, deep condition, blow dry, flat iron
Add protein treatment: +$25
Add trim: +$15
```"""
    },
    {
        "title": "Building Your Client Base - From Zero to Fully Booked",
        "category": "business_mentorship",
        "content": """Growing a loyal client base takes strategy and consistency. Here's how to attract and keep the right clients.

## Getting Your First Clients

### 1. Start with Your Circle
- Friends and family (at discounted rate, NOT free)
- Co-workers
- Church members
- Neighbors
- Ask them to refer others

**Important:** Charge something. Free work isn't valued and doesn't build a sustainable business.

### 2. Leverage Social Media

**Instagram Strategy:**
- Post 3-5 times per week minimum
- Use local hashtags (#AtlantaHairstylist, #NYCNaturalHair)
- Before/after photos (get permission!)
- Show your personality in Stories
- Respond to ALL comments and DMs
- Go live weekly

**Content Ideas:**
- Before/after transformations
- Tutorial clips
- Day in your life
- Client testimonials
- Hair tips and education
- Product recommendations
- Behind-the-scenes

### 3. Google Business Profile
- Set up your profile (free)
- Add photos regularly
- Respond to reviews
- Post updates
- Essential for local search

### 4. Referral Program
- Offer incentive for referrals
- Example: "$20 off your next service for each referral who books"
- Make referral cards
- Ask satisfied clients directly

### 5. Collaborate
- Partner with makeup artists
- Connect with photographers (for styled shoots)
- Network with event planners
- Wedding vendor partnerships
- Other stylists (complementary services)

## Retaining Clients (Most Important!)

**Client retention is cheaper than acquisition.** A loyal client is worth thousands in lifetime value.

### The Client Experience

**Before Appointment:**
- Send confirmation
- Clear directions/parking info
- What to expect

**During Appointment:**
- Consultation before starting
- Comfortable environment
- Offer refreshments
- Check in during service
- Explain what you're doing
- Give aftercare instructions

**After Appointment:**
- Follow up in 2-3 days
- Send care tips
- Remind of next appointment
- Remember personal details

### Building Loyalty

1. **Consistency:** Same quality every single time
2. **Remember details:** Kids names, job, upcoming events
3. **Loyalty rewards:** Every 10th visit discount, birthday offer
4. **Pre-book:** Book next appointment before they leave
5. **Special touches:** Free add-ons occasionally, holiday cards

### Rebooking Strategy

**At checkout:**
- "Let's get your next appointment on the calendar. Are we doing 6 or 8 weeks?"
- Don't ask "Would you like to book?" - assume the booking

**Send reminders:**
- 1 week before
- 1 day before
- Morning of

## Handling Difficult Clients

### The Chronic No-Show
**Policy:** Require deposit after first no-show, drop after second

**Verbiage:** "I noticed you've had to reschedule a few times. To hold your spot, I'll need a deposit of 50% that will be applied to your service."

### The Discount Seeker
**Response:** "I appreciate you asking! My prices reflect the quality of service and products you receive. I'd love to do your hair at my regular rate."

### The Never Satisfied
**If patterns emerge:** It's okay to "break up" with a client. "I don't think I'm the best fit for your hair goals. I'd recommend [another stylist]."

### Late Arrivals
**Policy:** "If you're more than 15 minutes late, we'll need to reschedule to ensure you get my full attention."

## Who NOT to Take as a Client

- Chronic no-shows
- Always negotiates price
- Disrespectful
- Unrealistic expectations they won't adjust
- Makes you dread their appointment

**Your energy matters.** Problem clients affect your mood, your other clients' experience, and your business.

## Tracking Client Growth

**Track monthly:**
- New clients
- Returning clients
- Rebooking rate (goal: 70%+)
- Revenue per client
- Referrals

**Signs of healthy growth:**
- More rebookings than new clients
- Clients referring others
- Less marketing needed
- Premium services being booked"""
    },
    {
        "title": "Social Media Marketing for Stylists - Growth Strategy",
        "category": "business_mentorship",
        "content": """Social media is your most powerful free marketing tool. Here's how to use it effectively to grow your business.

## Platform Strategy

### Instagram (Primary Platform for Stylists)

**Why Instagram:**
- Visual platform perfect for hair content
- Reels have massive organic reach
- Stories for daily connection
- Grid serves as your portfolio

**Profile Optimization:**
- Business account (for insights)
- Clear profile photo (your face)
- Bio: What you do + Location + How to book
- Link in bio to booking

**Bio Example:**
```
Natural Hair Specialist 🌱
Atlanta, GA 📍
Specializing in protective styles & silk press
👇 Book your appointment
[booking link]
```

### TikTok (Growth Platform)

**Why TikTok:**
- Massive organic reach (more than Instagram)
- Content can go viral easily
- Younger demographic (future clients)
- Behind-the-scenes performs well

**Content that works:**
- Hair transformations
- Tutorials
- "Day in my life"
- Trending sounds/challenges with hair twist

### Facebook (Community Building)

**Uses:**
- Local community groups
- Facebook Business page
- Reviews and recommendations
- Marketplace posts

## Content Strategy

### The 4 Content Pillars

**1. Transformation (40%)**
- Before/after photos
- Time-lapse videos
- "From dry to defined" content
- Dramatic changes

**2. Education (30%)**
- Hair tips
- Product reviews
- How-to tutorials
- Common mistakes
- Hair science made simple

**3. Behind-the-Scenes (20%)**
- Day in your life
- Your setup/space
- Product organization
- Real talk about the business

**4. Personal/Connection (10%)**
- Your story
- Why you do hair
- Celebrations and milestones
- Relatable content

### Content Creation Tips

**For Photos:**
- Consistent background
- Good lighting (natural is best)
- Multiple angles (front, side, back)
- Clean, styled finish
- Before AND after

**For Videos:**
- Vertical format for Reels/TikTok
- Hook in first 3 seconds
- Add captions (80% watch without sound)
- Keep it under 60 seconds for Reels
- Show your face - people connect with people

## Posting Schedule

**Minimum for growth:**
- Feed posts: 3-5x per week
- Stories: Daily
- Reels: 3-4x per week

**Best times to post:**
- Test your insights
- Generally: 6-9 AM, 12-2 PM, 7-9 PM
- Consistency matters more than perfect timing

## Hashtag Strategy

**Use a mix of:**
- Large hashtags (500K-1M): #NaturalHair #ProtectiveStyles
- Medium hashtags (50K-500K): #AtlantaNaturalHair #SilkPress
- Small/niche hashtags (under 50K): #AtlantaKnotlessBraids

**Tips:**
- Use 15-25 hashtags per post
- Create a branded hashtag
- Include location-based hashtags
- Update hashtags regularly based on performance

## Engaging and Growing

### Engagement Strategy
1. **Reply to EVERY comment** - shows you're active
2. **Respond to DMs promptly** - potential clients!
3. **Engage with others** - comment on local accounts
4. **Use interactive Stories** - polls, questions, quizzes
5. **Go live** - Instagram favors accounts that use all features

### Growing Your Following

**Organic Growth:**
- Consistent posting
- Engaging content
- Using Reels (higher reach)
- Collaborating with others
- Engaging on other accounts

**Paid Growth:**
- Boost best-performing posts
- Target local audience
- Start with $5-10/day
- Track what works

## Converting Followers to Clients

**In your content:**
- Clear calls to action ("Book link in bio")
- Show your location
- Share your availability
- Post client testimonials

**In your DMs:**
- Respond quickly
- Be friendly and professional
- Have a booking process ready
- Don't overwhelm with info - answer their question, then invite to book

## Common Mistakes

1. **Inconsistent posting** - Algorithm punishes gaps
2. **Only posting hair photos** - People want to know YOU
3. **Ignoring DMs** - Lost potential clients
4. **Poor quality images** - Invest in good lighting at minimum
5. **Not engaging with others** - Social media is social
6. **Giving up too soon** - Growth takes 3-6 months minimum"""
    },
    {
        "title": "Managing Business Finances - Money Basics for Stylists",
        "category": "business_mentorship",
        "content": """Financial management separates thriving businesses from struggling ones. Here's how to get your money right.

## Separate Business and Personal

**This is non-negotiable.**

1. **Open a business bank account**
   - Required for LLC/tax purposes
   - Makes tracking easier
   - Looks professional

2. **Get a business credit card**
   - Build business credit
   - Track expenses
   - Earn rewards on business purchases

3. **Pay yourself a regular salary**
   - Decide on an amount
   - Transfer weekly or bi-weekly
   - Don't just take when you need it

## Tracking Your Money

### What to Track

**Income:**
- Service revenue
- Product sales
- Tips
- Other income

**Expenses:**
- Products and supplies
- Rent/booth rental
- Utilities
- Marketing
- Insurance
- Continuing education
- Equipment
- Software/apps
- Professional fees

### Tools for Tracking

**Free:**
- Wave Accounting
- Spreadsheets

**Paid:**
- QuickBooks Self-Employed ($15/month)
- FreshBooks ($15/month)
- Square (free basic)

**Method:**
1. Connect bank account to software
2. Categorize transactions weekly
3. Review monthly
4. Save receipts digitally

## Tax Planning

### Self-Employment Taxes

As a self-employed stylist, you pay:
- Federal income tax
- Self-employment tax (15.3% for Social Security/Medicare)
- State income tax (if applicable)

**Total to set aside: 25-30% of profit**

### Quarterly Estimated Taxes

**Due dates:**
- April 15
- June 15
- September 15
- January 15

**If you don't pay quarterly:** Penalties and interest

### Common Deductions

**Direct Business Expenses:**
- Products and supplies
- Equipment and tools
- Booth/salon rent
- Business insurance
- Continuing education
- Marketing and advertising
- Professional fees (accounting, legal)
- Business-related travel

**Partial Deductions:**
- Cell phone (business portion)
- Internet (business portion)
- Vehicle (if mobile stylist - mileage)
- Home office (if applicable)

**Keep ALL receipts.** Digital photos or apps like Expensify work well.

## Building Financial Security

### Emergency Fund

**Goal: 3-6 months of expenses**

Why it matters:
- Covers slow months
- Handles unexpected expenses
- Reduces financial stress

How to build:
- Set aside 10% of every payment
- Keep in separate savings account
- Don't touch it unless true emergency

### Retirement Savings

**Options for self-employed:**

1. **SEP IRA**
   - Contribute up to 25% of net self-employment income
   - Max ~$66,000/year (2023)
   - Easy to set up

2. **Solo 401(k)**
   - Higher contribution limits
   - More paperwork
   - Good for higher earners

**Start with something.** Even $50/month adds up.

### Insurance

**Must-have:**
- Professional liability
- General liability
- Health insurance

**Nice to have:**
- Disability insurance (protects your income)
- Life insurance

## Monthly Financial Routine

**Weekly:**
- Categorize transactions
- Track income
- Save receipts

**Monthly:**
- Review profit and loss
- Check against goals
- Set aside tax money
- Pay yourself

**Quarterly:**
- Pay estimated taxes
- Review bigger picture
- Adjust pricing if needed

**Annually:**
- File taxes
- Review insurance
- Evaluate business structure
- Set new financial goals

## Financial Red Flags

Warning signs:
- Living service-to-service
- Dreading tax time
- No idea how much you profit
- Using credit for basic expenses
- Not paying yourself consistently
- No savings

**If any apply:** It's time to get organized. Start with tracking everything for one month.

## Profit Goals

**Aim for at least 30% profit margin**

Example:
- Monthly revenue: $5,000
- Expenses: $3,500
- Profit: $1,500 (30%)

If profit is less than 20%:
- Raise prices
- Reduce expenses
- Increase service volume
- Add higher-margin services"""
    },
]

# =============================================================================
# BRAND INFORMATION
# =============================================================================

BRAND_INFO = [
    {
        "title": "About TaysLuxe - Your Hair Business Mentor",
        "category": "brand_info",
        "content": """TaysLuxe is your hair business mentor - here to help you master your craft AND build a business that actually makes money.

## What We're About

We're not just about doing hair. We're about building careers. Too many talented stylists struggle because nobody taught them the business side. That's what we're here to change.

Think of us as the big sister in the industry who's been there, made the mistakes, and wants to help you skip the hard lessons we learned the expensive way.

## Who We Help

- **New stylists** figuring out how to start
- **Experienced stylists** ready to level up their income
- **Booth renters** wanting to build their clientele
- **Salon owners** growing their business
- **Natural hair enthusiasts** learning to care for their hair
- **Anyone** who wants real talk, not fluff

## How We Mentor

### Hair Mastery
We teach you the science behind the styling:
- Why porosity matters more than hair type
- How to diagnose and solve any hair problem
- Techniques that get clients coming back
- Product knowledge that builds trust

### Business Building
We teach you what cosmetology school didn't:
- Pricing that actually makes you money
- Getting clients without begging
- Social media that converts followers to bookings
- Managing money so you're not broke
- Building a business that doesn't burn you out

## Our Mentoring Philosophy

**We keep it real**
No sugarcoating. If something's not working, we'll tell you - and show you how to fix it.

**We teach the 'why'**
We don't just tell you what to do. We help you understand so you can make smart decisions on your own.

**We're in your corner**
Your success is our success. We celebrate your wins and support you through the hard stuff.

**We give you specifics**
No vague advice. Real numbers, real strategies, real steps you can actually take.

## Our Promise

Every conversation should leave you feeling:
- Like you learned something valuable
- Clear on what to do next
- Supported in your journey
- Motivated to take action

You've got talent. We're here to help you turn it into a thriving career."""
    },
]

## Connect With Us

- Follow @TaysLuxe on social media
- Access our courses and resources
- Join our community
- Reach out with questions - we're here to help!

**Our Promise:** Every interaction with TayAI should leave you feeling supported, informed, and motivated."""
    },
]

# =============================================================================
# COMBINE ALL CONTENT
# =============================================================================

KNOWLEDGE_BASE_CONTENT = (
    HAIR_FOUNDATIONS +
    HAIR_STYLING +
    BUSINESS_MENTORSHIP +
    BRAND_INFO
)


# =============================================================================
# SEEDING FUNCTIONS
# =============================================================================

async def seed_knowledge_base(dry_run: bool = False, category_filter: str = None):
    """Seed the knowledge base with initial content."""
    
    items = KNOWLEDGE_BASE_CONTENT
    if category_filter:
        items = [i for i in items if category_filter.lower() in i["category"].lower()]
    
    print(f"\n📚 Seeding Knowledge Base")
    print(f"   Total items: {len(items)}")
    if category_filter:
        print(f"   Category filter: {category_filter}")
    print("=" * 50)
    
    if dry_run:
        print("\n🔍 DRY RUN - No changes will be made\n")
        for item in items:
            print(f"  📄 {item['title']}")
            print(f"     Category: {item['category']}")
            print(f"     Content: {len(item['content'])} chars")
            print()
        return
    
    # Create database session
    db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        service = KnowledgeService(session)
        
        success = 0
        errors = 0
        
        for item in items:
            try:
                print(f"  📄 Adding: {item['title']}...", end=" ")
                
                await service.create_knowledge_item(
                    KnowledgeBaseCreate(
                        title=item["title"],
                        content=item["content"],
                        category=item["category"]
                    )
                )
                print("✅")
                success += 1
                
            except Exception as e:
                print(f"❌ Error: {e}")
                errors += 1
        
        print("\n" + "=" * 50)
        print(f"✅ Success: {success}")
        print(f"❌ Errors: {errors}")
    
    await engine.dispose()


def main():
    parser = argparse.ArgumentParser(description="Seed TayAI knowledge base")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving")
    parser.add_argument("--category", type=str, help="Filter by category")
    
    args = parser.parse_args()
    asyncio.run(seed_knowledge_base(dry_run=args.dry_run, category_filter=args.category))


if __name__ == "__main__":
    main()
