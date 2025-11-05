# How Twilio Treats Multiple Sender Numbers

## Overview

When you have multiple WhatsApp numbers in Twilio, **each number operates independently**. Twilio creates **separate conversations** for each customer + number combination.

## How Twilio Organizes Conversations

### 1. Conversation Creation Rules

**Each conversation is tied to:**
- **Customer Phone Number** (WhatsApp recipient)
- **Your Twilio Number** (sender, via `proxyAddress`)

**Key Point**: Same customer + different number = **Different conversations**

### Example Scenario

If you have 2 numbers:
- Support Number: `+1234567890`
- Sales Number: `+0987654321`

And customer `+201016666348` messages both:

```
Customer messages Support Number (+1234567890)
    ↓
Twilio creates: Conversation A
    - Customer: +201016666348
    - Your Number: +1234567890 (proxyAddress)
    - Conversation SID: CHaaa...

Customer messages Sales Number (+0987654321)
    ↓
Twilio creates: Conversation B
    - Customer: +201016666348 (same customer!)
    - Your Number: +0987654321 (different proxyAddress)
    - Conversation SID: CHbbb...
```

**Result**: You get **2 separate conversations** for the same customer!

## The `proxyAddress` Field

### What is proxyAddress?

The `proxyAddress` is stored in the **Participant's `messagingBinding`**:

```typescript
participant.messagingBinding = {
  address: "whatsapp:+201016666348",      // Customer's number
  proxyAddress: "whatsapp:+1234567890",   // YOUR number (which number sent/received)
  type: "whatsapp"
}
```

### How We Extract It

**Location**: `lib/twilio-service.ts` (line 826)

```typescript
if (customerParticipant?.messagingBinding?.proxyAddress) {
  proxyAddress = customerParticipant.messagingBinding.proxyAddress;
  
  // Match to configured numbers
  const matchedNumber = getNumberByPhone(proxyAddress);
  if (matchedNumber) {
    twilioNumberId = matchedNumber.id;  // e.g., "1" or "2"
  }
}
```

### What proxyAddress Tells Us

- **Which number** the conversation belongs to
- **Which number** to use when sending replies
- **How to filter** conversations by number

## Conversation Structure in Twilio

### Participant Structure

Each conversation has participants with:
- **Customer Participant**: 
  - `messagingBinding.address` = Customer's WhatsApp number
  - `messagingBinding.proxyAddress` = Your Twilio number
  - `identity` = null (for WhatsApp customers)

- **Agent/System Participant**:
  - `identity` = "admin_001" or "agent-123"
  - No `messagingBinding` (Chat SDK user)

### Conversation Properties

```typescript
{
  sid: "CHxxx...",                    // Unique conversation ID
  uniqueName: "whatsapp_201016666348", // Optional unique identifier
  friendlyName: "Chat with +201016666348",
  participants: [
    {
      identity: null,
      messagingBinding: {
        address: "whatsapp:+201016666348",      // Customer
        proxyAddress: "whatsapp:+1234567890",   // YOUR number
        type: "whatsapp"
      }
    },
    {
      identity: "admin_001",                    // Agent
      messagingBinding: null
    }
  ]
}
```

## How Our System Handles This

### 1. Conversation Fetching

When fetching conversations:
```typescript
// Get all conversations (from all numbers)
conversations = await twilioClient.conversations.v1.conversations.list();

// For each conversation, extract proxyAddress
proxyAddress = participant.messagingBinding.proxyAddress;
// e.g., "whatsapp:+1234567890"
```

### 2. Number Matching

We match `proxyAddress` to configured numbers:
```typescript
const matchedNumber = getNumberByPhone("whatsapp:+1234567890");
// Returns: { id: "1", number: "+1234567890", name: "Support Number" }

twilioNumberId = matchedNumber.id;  // "1"
```

### 3. Filtering by Number

When you select a number in the UI:
```typescript
// Filter conversations by selected number
if (numberId) {
  conversations = conversations.filter(conv => 
    conv.twilioNumberId === numberId
  );
}
```

## Important Behaviors

### 1. Separate Conversations

**Same customer messaging different numbers = Separate conversations**

- Customer messages Support Number → Conversation A
- Customer messages Sales Number → Conversation B
- These are **completely separate** in Twilio

### 2. Conversation Isolation

Each conversation:
- Has its own message history
- Has its own participants
- Has its own state (open/closed)
- Is independent of other conversations

### 3. Message Sending

When sending a message:
- You must use the **same number** that created the conversation
- Sending from a different number creates a **new conversation**

### 4. Conversation Lookup

Twilio doesn't automatically merge conversations:
- No "all conversations with customer X" endpoint
- You must:
  - Fetch all conversations
  - Filter by customer phone number
  - Group by customer manually

## How We Identify Conversations by Number

### Current Implementation

1. **Extract proxyAddress** from participant
2. **Match to configured number** using `getNumberByPhone()`
3. **Store twilioNumberId** in conversation object
4. **Filter by numberId** when user selects a number

### Code Flow

```typescript
// 1. Fetch conversations
const conversations = await twilioClient.conversations.v1.conversations.list();

// 2. For each conversation, get participants
const participants = await conversation.participants.list();

// 3. Find customer participant
const customerParticipant = participants.find(p => 
  p.messagingBinding?.address && !p.identity?.startsWith('agent-')
);

// 4. Extract proxyAddress (YOUR number)
const proxyAddress = customerParticipant.messagingBinding.proxyAddress;
// e.g., "whatsapp:+1234567890"

// 5. Match to configured number
const numberConfig = getNumberByPhone(proxyAddress);
// Returns: { id: "1", number: "+1234567890", name: "Support Number" }

// 6. Store number ID
conversation.twilioNumberId = numberConfig.id;
```

## Real-World Example

### Scenario: Customer Contacts Both Numbers

**Setup:**
- Support: `+1234567890`
- Sales: `+0987654321`
- Customer: `+201016666348`

**What Happens:**

1. Customer messages Support (`+1234567890`):
   ```
   Conversation CHaaa:
   - proxyAddress: whatsapp:+1234567890
   - Customer: +201016666348
   - twilioNumberId: "1" (Support)
   ```

2. Customer messages Sales (`+0987654321`):
   ```
   Conversation CHbbb:
   - proxyAddress: whatsapp:+0987654321
   - Customer: +201016666348 (same customer!)
   - twilioNumberId: "2" (Sales)
   ```

**Result**: 2 separate conversations for the same customer!

### Filtering in UI

- **Select "Support Number"**: Shows only Conversation CHaaa
- **Select "Sales Number"**: Shows only Conversation CHbbb
- **Select "All Numbers"**: Shows both conversations

## Best Practices

### 1. Use Number Filtering
- Always filter by number to avoid confusion
- Each number has its own conversation list

### 2. Understand Conversation Scope
- Conversations are **per-number**
- Same customer ≠ same conversation (if different numbers)

### 3. Message Routing
- Always use the conversation's `proxyAddress` when replying
- Don't switch numbers mid-conversation (creates new conversation)

### 4. Customer Identification
- Use `messagingBinding.address` to identify customer
- Use `proxyAddress` to identify which number they're using

## Summary

**Twilio's Behavior:**
- ✅ Each number creates separate conversations
- ✅ Same customer + different number = separate conversations
- ✅ `proxyAddress` identifies which number the conversation uses
- ✅ Conversations are isolated per number

**Our Implementation:**
- ✅ Extracts `proxyAddress` from each conversation
- ✅ Matches to configured numbers
- ✅ Stores `twilioNumberId` for filtering
- ✅ Allows filtering conversations by selected number

**Key Takeaway:**
Multiple numbers = Multiple independent conversation threads, even for the same customer!

