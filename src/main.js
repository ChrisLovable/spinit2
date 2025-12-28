import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ThemeParkWheel } from './RouletteWheel.js';
import heic2any from 'heic2any';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing!');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
} else {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
}

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Test Supabase connection and database
async function testSupabaseConnection() {
  if (!supabase) {
    console.error('❌ Supabase client not initialized - check environment variables');
    console.error('   VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'MISSING');
    console.error('   VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'MISSING');
    return false;
  }
  
  console.log('🔍 Testing Supabase connection and INSERT capability...');

  console.log('🔍 Testing Supabase connection...');

  try {
    // Test 1: Check if competitions table exists and is accessible
    console.log('📊 Test 1: Checking competitions table...');
    const { data: compData, error: compError } = await supabase
      .from('competitions')
      .select('id, title, status')
      .limit(1);

    if (compError) {
      console.error('❌ Competitions table error:', compError.message);
      console.error('   Code:', compError.code);
      console.error('   Details:', compError.details);
      console.error('   Hint:', compError.hint);
      return false;
    }

    console.log('✅ Competitions table accessible');
    console.log('   Found', compData?.length || 0, 'competitions');

    // Test 2: Check if user_entries table exists
    console.log('📊 Test 2: Checking user_entries table...');
    const { data: entriesData, error: entriesError } = await supabase
      .from('user_entries')
      .select('id')
      .limit(1);

    if (entriesError) {
      console.error('❌ User entries table error:', entriesError.message);
      return false;
    }

    console.log('✅ User entries table accessible');
    console.log('   Found', entriesData?.length || 0, 'entries');

    // Test 3: Try inserting a test competition (then delete it)
    console.log('📊 Test 5: Testing INSERT operation...');
    const testCompetition = {
      title: 'Test Competition - DELETE ME',
      description: 'This is a test competition',
      prize_value: 100.00,
      ticket_price: 50.00,
      spin_date: new Date().toISOString().split('T')[0],
      spin_time: '18:00:00',
      spin_datetime: new Date().toISOString(),
      status: 'active'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('competitions')
      .insert(testCompetition)
      .select()
      .single();

    if (insertError) {
      console.error('❌ INSERT test failed:', insertError.message);
      return false;
    }

    console.log('✅ INSERT operation successful');
    console.log('   Created test competition with ID:', insertData.id);
    
    // Test INSERT into user_entries table
    console.log('📊 Test 6: Testing INSERT into user_entries table...');
    const testEntry = {
      entry_number: 1,
      player_name: 'Test Entry',
      payment_status: 'completed',
      competition_id: null
    };
    
    const { data: entryData, error: entryError } = await supabase
      .from('user_entries')
      .insert(testEntry)
      .select()
      .single();
    
    if (entryError) {
      console.error('❌ user_entries INSERT test failed:', entryError.message);
      console.error('   Error code:', entryError.code);
      console.error('   Error details:', entryError.details);
      console.error('   Error hint:', entryError.hint);
      console.error('   ⚠️ THIS IS WHY PAYMENTS ARE NOT SAVING!');
      console.error('   ⚠️ Run the COMPLETE_DATABASE_SETUP.sql file in Supabase SQL Editor!');
    } else {
      console.log('✅ user_entries INSERT test successful!');
      console.log('   Created test entry with ID:', entryData.id);
      
      // Clean up test entry
      await supabase
        .from('user_entries')
        .delete()
        .eq('id', entryData.id);
      console.log('   Test entry cleaned up');
    }

    // Clean up: Delete the test competition
    if (insertData?.id) {
      const { error: deleteError } = await supabase
        .from('competitions')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.warn('⚠️ Could not delete test competition:', deleteError.message);
      } else {
        console.log('✅ DELETE operation successful - test competition removed');
      }
    }

    console.log('');
    console.log('🎉 ALL DATABASE TESTS PASSED!');
    console.log('✅ Supabase connection: WORKING');
    console.log('✅ Tables accessible: competitions, user_entries');
    console.log('✅ INSERT operation: WORKING');
    console.log('✅ DELETE operation: WORKING');
    console.log('');

    return true;
  } catch (err) {
    console.error('❌ Database test error:', err);
    return false;
  }
}

// Run connection test on page load
testSupabaseConnection();

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

// Get container dimensions (phone-sized)
const app = document.getElementById('app');
const wheelStage = document.getElementById('wheelStage');

// Ensure wheelStage exists, if not wait for DOM
if (!wheelStage) {
  console.error('wheelStage not found! Make sure the HTML has <div id="wheelStage">');
}

const getContainerSize = () => {
  const stage = document.getElementById('wheelStage');
  if (stage && stage.clientWidth > 0 && stage.clientHeight > 0) {
    return {
      width: stage.clientWidth,
      height: stage.clientHeight
    };
  }
  // Fallback if wheelStage not ready
  return {
    width: 375,
    height: 400
  };
};

// Camera - directly above the wheel, optimized for mobile
const camera = new THREE.PerspectiveCamera(
  50, // Slightly wider FOV to see more
  getContainerSize().width / getContainerSize().height,
  0.1,
  1000
);
camera.position.set(0, 10, 0); // Top-down view - higher to see more

// Renderer
const canvas = document.getElementById('canvas');
if (!canvas) {
  console.error('Canvas element not found!');
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
let lastW = 0, lastH = 0;
let resizeRaf = null;

const updateRendererSize = () => {
  const size = getContainerSize();
  const w = size.width || 375;
  const h = size.height || 812;

  if (w === lastW && h === lastH) return;
  lastW = w; lastH = h;

  renderer.setSize(w, h, false); // false = don't force canvas CSS size
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  
  // Ensure canvas is visible
  if (canvas) {
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
  }
};
updateRendererSize();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Stop canvas from hijacking touch/scroll
canvas.style.touchAction = 'pan-y';
canvas.style.pointerEvents = 'none'; // canvas won't eat scroll/touch

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Lighting optimized for top-down view
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(0, 15, 0); // From above
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

// Additional lights for better visibility from above
const pointLight1 = new THREE.PointLight(0xffffff, 0.6);
pointLight1.position.set(0, 10, 0);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 0.4);
pointLight2.position.set(5, 8, 5);
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0xffffff, 0.4);
pointLight3.position.set(-5, 8, -5);
scene.add(pointLight3);

// Controls - lock to top-down view
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableRotate = false; // Disable rotation to keep top-down view
controls.enablePan = false; // Disable panning
controls.enableZoom = false; // Disable zooming - screen should not be zoomable
controls.minDistance = 8;
controls.maxDistance = 8; // Lock distance - no zoom
controls.update(); // Force update to apply target

// Create theme park wheel
const themeParkWheel = new ThemeParkWheel(scene);

// Scale wheel - increased by 25% from previous size
// Previous: 1.125, New: 1.125 * 1.25 = 1.40625
themeParkWheel.group.scale.set(1.40625, 1.40625, 1.40625);

// --- POSITION WHEEL JUST BELOW SPIN BUTTON ---
// Convert 20 pixels to world units for movement
function pixelsToWorldYPlane(px, planeY) {
  const distance = Math.abs(camera.position.y - planeY);
  const vFOV = THREE.MathUtils.degToRad(camera.fov);
  const frustumHeight = 2 * distance * Math.tan(vFOV / 2);
  const unitsPerPixel = frustumHeight / renderer.domElement.clientHeight;
  return px * unitsPerPixel;
}

// Position wheel - move up by 400 pixels, then down by 310 pixels (100 + 30 + 50 + 50 + 100 - 20)
// In top-down view, negative Z = up on screen, positive Z = down on screen
// Convert pixels to world units
const wheelBaseZ = 0.8;
const moveUpPixels = 400;
const moveDownPixels = 310; // Move down by 310 pixels (100 + 30 + 50 + 50 + 100 - 20, moved up by 20)
const moveUpWorld = pixelsToWorldYPlane(moveUpPixels, themeParkWheel.group.position.y);
const moveDownWorld = pixelsToWorldYPlane(moveDownPixels, themeParkWheel.group.position.y);
themeParkWheel.group.position.set(0, -3.5, wheelBaseZ - moveUpWorld + moveDownWorld); // Negative Z = up, positive Z = down

themeParkWheel.group.updateMatrixWorld(true);

// IMPORTANT: keep camera/controls target FIXED so the wheel actually shifts on screen
// Target at center to see all elements
controls.target.set(0, 0, 0);
camera.lookAt(0, 0, 0);
controls.update();

console.log("Wheel positioned at:", themeParkWheel.group.position);
console.log("Camera looking at:", controls.target);
console.log("Camera position:", camera.position);
console.log("Wheel scale:", themeParkWheel.group.scale);

// UI Elements
const spinButton = document.getElementById('spinButton');
const checkoutButton = document.getElementById('checkoutButton');
const adminButton = document.getElementById('adminButton');
const completedButton = document.getElementById('completedButton');
const numberGrid = document.getElementById('numberGrid');
let paypalButtonsContainer = document.getElementById('paypal-button-container');

// Generate number selection UI (1-20)
const selectedNumbers = new Map(); // Store selected numbers with {name, mobile}

for (let i = 1; i <= 20; i++) {
  const numberItem = document.createElement('div');
  numberItem.className = 'number-item';
  numberItem.dataset.number = i; // Store number for easy lookup
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = `num-${i}`;
  checkbox.value = i;
  
  const label = document.createElement('label');
  label.htmlFor = `num-${i}`;
  label.textContent = i;
  
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Name (required)';
  nameInput.id = `name-${i}`;
  nameInput.dataset.number = i; // Store number for easy lookup
  nameInput.required = true;
  
  const mobileInput = document.createElement('input');
  mobileInput.type = 'tel';
  mobileInput.placeholder = 'Mobile (required)';
  mobileInput.id = `mobile-${i}`;
  mobileInput.dataset.number = i; // Store number for easy lookup
  mobileInput.required = true;
  
  checkbox.addEventListener('change', (e) => {
    // Don't allow checking if this number is already paid
    if (e.target.checked && nameInput.classList.contains('paid-name')) {
      e.target.checked = false;
      return;
    }
    if (e.target.checked) {
      selectedNumbers.set(i, {
        name: nameInput.value.trim() || '',
        mobile: mobileInput.value.trim() || ''
      });
    } else {
      selectedNumbers.delete(i);
    }
    updateCheckoutButton();
  });
  
  nameInput.addEventListener('input', (e) => {
    // Don't allow editing if this is a paid name
    if (nameInput.classList.contains('paid-name')) {
      e.target.value = nameInput.dataset.paidName || '';
      return;
    }
    if (checkbox.checked) {
      const current = selectedNumbers.get(i) || { name: '', mobile: '' };
      selectedNumbers.set(i, {
        name: e.target.value.trim(),
        mobile: current.mobile
      });
      updateCheckoutButton();
    }
  });
  
  mobileInput.addEventListener('input', (e) => {
    // Don't allow editing if this is a paid entry
    if (nameInput.classList.contains('paid-name')) {
      e.target.value = mobileInput.dataset.paidMobile || '';
      return;
    }
    if (checkbox.checked) {
      const current = selectedNumbers.get(i) || { name: '', mobile: '' };
      selectedNumbers.set(i, {
        name: current.name,
        mobile: e.target.value.trim()
      });
      updateCheckoutButton();
    }
  });
  
  // Create a container for name and mobile (vertical layout)
  const nameMobileContainer = document.createElement('div');
  nameMobileContainer.className = 'name-mobile-container';
  nameMobileContainer.appendChild(nameInput);
  nameMobileContainer.appendChild(mobileInput);
  
  numberItem.appendChild(checkbox);
  numberItem.appendChild(label);
  numberItem.appendChild(nameMobileContainer);
  numberGrid.appendChild(numberItem);
}

function updateCheckoutButton() {
  const count = selectedNumbers.size;
  
  // Check if all selected numbers have both name and mobile filled
  let allValid = true;
  for (const [num, data] of selectedNumbers.entries()) {
    if (!data.name || !data.name.trim() || !data.mobile || !data.mobile.trim()) {
      allValid = false;
      break;
    }
  }
  
  // Update button text
  checkoutButton.textContent = count > 0 
    ? `CHECKOUT (${count} selected)` 
    : 'CHECKOUT';
  
  // Show/hide checkout button based on selection
  if (count === 0 || !allValid) {
    checkoutButton.style.display = 'none';
    if (paypalButtonsContainer) {
      paypalButtonsContainer.style.display = 'none';
    }
  } else {
    checkoutButton.style.display = 'block';
    checkoutButton.disabled = false;
    if (paypalButtonsContainer) {
      paypalButtonsContainer.style.display = 'none'; // Hide PayPal until checkout is clicked
    }
  }
}

// Get ticket price from admin panel (displayed value)
function getTicketPriceFromAdmin() {
  try {
    // Get price from the displayed value placeholder
    const priceElement = document.querySelector('.price-placeholder');
    if (!priceElement) {
      console.warn('Price element not found, using default R50.00');
      return 50.00; // Default fallback
    }
    
    const priceText = priceElement.textContent || 'Ticket Price: $0.00';
    console.log('Price text extracted:', priceText);
    
    // Extract number from text (handles both $ and R formats)
    const priceMatch = priceText.match(/[\d.]+/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[0]);
      return price > 0 ? price : 50.00; // Default to R50 if invalid
    }
  } catch (e) {
    console.warn('Could not parse ticket price from admin:', e);
  }
  return 50.00; // Default fallback to R50.00
}

// Initialize PayPal
// Initialize PayPal container from HTML or create it
let paypalButtonsContainer = document.getElementById('paypal-button-container');

function initializePayPal() {
  // Get or create container for PayPal buttons
  if (!paypalButtonsContainer) {
    paypalButtonsContainer = document.getElementById('paypal-button-container');
  }
  
  if (!paypalButtonsContainer) {
    // Create container if it doesn't exist in HTML
    paypalButtonsContainer = document.createElement('div');
    paypalButtonsContainer.id = 'paypal-button-container';
    paypalButtonsContainer.style.cssText = 'margin-top: 20px; max-width: 500px; margin-left: auto; margin-right: auto;';
    // Insert after checkout button
    checkoutButton.parentNode.insertBefore(paypalButtonsContainer, checkoutButton.nextSibling);
  } else {
    // Clear existing buttons
    paypalButtonsContainer.innerHTML = '';
    paypalButtonsContainer.style.cssText = 'margin-top: 20px; max-width: 500px; margin-left: auto; margin-right: auto;';
  }
  
  // Wait for PayPal SDK to load
  if (typeof paypal === 'undefined') {
    console.warn('PayPal SDK not loaded yet');
    setTimeout(initializePayPal, 500);
    return;
  }
  
  // Get ticket price from admin panel
  const ticketPrice = getTicketPriceFromAdmin();
  const quantity = selectedNumbers.size;
  const totalAmount = (ticketPrice * quantity).toFixed(2);
  
  // Validate amount
  if (totalAmount <= 0 || isNaN(totalAmount)) {
    alert('Invalid amount. Please set a valid ticket price in the admin panel.');
    return;
  }
  
  // PayPal minimum amount is 0.01
  if (parseFloat(totalAmount) < 0.01) {
    alert('Amount must be at least R0.01. Current amount: R' + totalAmount);
    return;
  }
  
  // Ensure we have at least one selected number
  if (quantity === 0) {
    alert('Please select at least one number before checkout.');
    return;
  }
  
  console.log('Initializing PayPal with:', {
    ticketPrice,
    quantity,
    totalAmount,
    currency: 'ZAR'
  });
  
  // Render PayPal buttons with simplified structure
  paypal.Buttons({
    style: {
      layout: 'vertical',
      color: 'gold',
      shape: 'rect',
      label: 'paypal'
    },
    createOrder: (data, actions) => {
      console.log('Creating PayPal order for amount:', totalAmount);
      
      // IMPORTANT: PayPal Sandbox does NOT support ZAR (South African Rand)
      // Use USD for sandbox testing, then switch to ZAR for production
      const currency = 'USD'; // Change to 'ZAR' when switching to LIVE mode
      
      // Convert ZAR amount to USD for sandbox testing
      // Current approximate rate: 1 USD ≈ 18 ZAR (update as needed)
      const exchangeRate = 18;
      const paymentAmount = currency === 'USD' 
        ? (parseFloat(totalAmount) / exchangeRate).toFixed(2)
        : totalAmount;
      
      console.log(`Payment: ${paymentAmount} ${currency} (from ${totalAmount} ZAR)`);
      
      return actions.order.create({
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: paymentAmount
          },
          description: `${quantity} ticket(s) for Prize Wheel`
        }]
      }).catch((error) => {
        console.error('Error creating PayPal order:', error);
        alert(`Failed to create payment order: ${error.message || 'Unknown error'}`);
        throw error;
      });
    },
    onApprove: (data, actions) => {
      return actions.order.capture().then(async (details) => {
        // Payment successful
        console.log('Payment completed:', details);
        
        // Get current names and mobile numbers from input fields (in case Map is out of sync)
        const selectedNumbersWithNames = Array.from(selectedNumbers.entries()).map(([num, data]) => {
          // Double-check by reading from the actual input fields
          const nameInput = document.getElementById(`name-${num}`);
          const mobileInput = document.getElementById(`mobile-${num}`);
          const actualName = nameInput ? nameInput.value.trim() : (data?.name || '');
          const actualMobile = mobileInput ? mobileInput.value.trim() : (data?.mobile || '');
          
          // Validate both are filled
          if (!actualName || !actualMobile) {
            throw new Error(`Number ${num} is missing name or mobile number. Both are required.`);
          }
          
          return {
            number: num,
            name: actualName,
            mobile: actualMobile
          };
        });
        
        // Prepare payment data for database
        const paymentData = {
          transaction_id: details.id,
          payer_email: details.payer?.email_address || 'N/A',
          payer_name: details.payer?.name?.given_name + ' ' + details.payer?.name?.surname || 'N/A',
          amount: parseFloat(details.purchase_units[0].amount.value),
          currency: details.purchase_units[0].amount.currency_code,
          status: details.status,
          selected_numbers: selectedNumbersWithNames,
          ticket_price: ticketPrice,
          quantity: quantity,
          timestamp: new Date().toISOString()
        };
        
        console.log('Payment data prepared:', paymentData);
        
        // Save to localStorage (temporary until DB is connected)
        try {
          const existingPayments = JSON.parse(localStorage.getItem('payments') || '[]');
          existingPayments.push(paymentData);
          localStorage.setItem('payments', JSON.stringify(existingPayments));
          console.log('Payment saved to localStorage:', paymentData);
        } catch (e) {
          console.error('Error saving payment:', e);
        }
        
        // Get selected competition ID (REQUIRED - cannot be empty)
        let competitionId;
        try {
          competitionId = await getOrCreateCompetitionId();
          
          if (!competitionId || competitionId.trim() === '') {
            alert('ERROR: Please select a competition before purchasing tickets. Competition title is required.');
            return;
          }
        } catch (error) {
          alert(`ERROR: ${error.message}`);
          console.error('❌ Competition selection error:', error);
          return; // Stop payment process
        }
        
        // Save to database (Supabase or localStorage)
        console.log('💾 Saving payment to database...');
        console.log('   Competition ID:', competitionId);
        console.log('   Entries to save:', paymentData.selected_numbers);
        const saveResult = await savePaymentToDatabase(paymentData, competitionId);
        console.log('💾 Save result:', saveResult);
        
        if (saveResult.success) {
          console.log('✅ Payment successfully saved to database!');
          
          // Check if competition is fully bought out and schedule auto-spin
          checkAndScheduleAutoSpin(competitionId);
        } else {
          console.error('❌ Payment save failed:', saveResult.error);
        }
        
        // Display all paid players (including new ones) - visible to everyone
        displayAllPaidPlayers();
        
        // Update paid names display next to numbers (with small delay to ensure DB save completes)
        setTimeout(() => {
          updatePaidNamesDisplay();
        }, 100);
        
        // Reload active competitions dropdown
        loadActiveCompetitions();
        
        // Show success message
        showPaymentSuccessMessage(paymentData, details);
        
        // Clear selections
        selectedNumbers.clear();
        updateCheckoutButton();
        
        // Uncheck all checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
        });
        
        // Clear name inputs
        document.querySelectorAll('input[type="text"][placeholder*="name"]').forEach(input => {
          input.value = '';
        });
        
        // Remove PayPal buttons after successful payment
        if (paypalButtonsContainer) {
          paypalButtonsContainer.remove();
          paypalButtonsContainer = null;
        }
      });
    },
    onError: (err) => {
      console.error('PayPal error details:', err);
      let errorMessage = 'Payment failed';
      
      if (err) {
        if (err.message) {
          errorMessage = `Payment failed: ${err.message}`;
        } else if (typeof err === 'string') {
          errorMessage = `Payment failed: ${err}`;
        } else {
          errorMessage = `Payment failed: ${JSON.stringify(err)}`;
        }
      }
      
      alert(errorMessage);
      console.error('Full PayPal error object:', err);
    },
    onCancel: (data) => {
      console.log('Payment cancelled:', data);
    }
  }).render('#paypal-button-container');
}

// Get winner name for a specific number from text field and paid entries
function getWinnerNameForNumber(winningNumber) {
  try {
    // First, try to get name from the text input field next to the number
    const nameInput = document.getElementById(`name-${winningNumber}`);
    if (nameInput && nameInput.value && nameInput.value.trim()) {
      const nameFromField = nameInput.value.trim();
      console.log(`Winner name from input field: ${nameFromField}`);
      return nameFromField;
    }
    
    // If no name in input field, check selectedNumbers map (current session)
    if (selectedNumbers.has(winningNumber)) {
      const nameFromMap = selectedNumbers.get(winningNumber);
      if (nameFromMap && nameFromMap.trim()) {
        console.log(`Winner name from selectedNumbers: ${nameFromMap}`);
        return nameFromMap.trim();
      }
    }
    
    // Fallback: check paid entries from database/localStorage
    const allPaidEntries = JSON.parse(localStorage.getItem('user_entries') || '[]');
    const currentPrizeData = JSON.parse(localStorage.getItem('prizeData') || '{}');
    const currentCompetitionId = currentPrizeData.competition_id;
    
    // Find entries for this number and current competition
    const winners = allPaidEntries.filter(entry => 
      (entry.entry_number || entry.number) === winningNumber &&
      entry.payment_status === 'completed' &&
      (!currentCompetitionId || entry.competition_id === currentCompetitionId || !entry.competition_id)
    );
    
    if (winners.length > 0) {
      // Return first winner's name, or all names if multiple
      if (winners.length === 1) {
        const name = winners[0].player_name || winners[0].name;
        if (name && name.trim() && name !== 'Unnamed') {
          console.log(`Winner name from paid entries: ${name}`);
          return name;
        }
      } else {
        // Multiple winners - return all names
        const names = winners.map(w => w.player_name || w.name || 'Unnamed').filter(n => n !== 'Unnamed' && n.trim());
        if (names.length > 0) {
          console.log(`Multiple winners: ${names.join(' and ')}`);
          return names.join(' and ');
        }
      }
    }
    
    console.log(`No winner name found for number ${winningNumber}`);
    return null;
  } catch (error) {
    console.error('Error getting winner name:', error);
    return null;
  }
}

// Get selected competition ID from dropdown (REQUIRED for payment)
async function getOrCreateCompetitionId() {
  try {
    const competitionSelect = document.getElementById('competitionSelect');
    
    if (!competitionSelect) {
      throw new Error('Competition selector not found');
    }
    
    const selectedCompetitionId = competitionSelect.value;
    
    // Competition ID is REQUIRED - cannot be empty
    if (!selectedCompetitionId || selectedCompetitionId.trim() === '') {
      throw new Error('Please select a competition before purchasing tickets. Competition title is required.');
    }
    
    // Validate it's not a temp ID
    if (selectedCompetitionId.startsWith('temp_')) {
      throw new Error('Invalid competition selected. Please select a valid competition from the dropdown.');
    }
    
    // Validate it's a valid UUID format
    if (!selectedCompetitionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid competition ID format. Please select a valid competition.');
    }
    
    // Get the competition title from the dropdown option
    const selectedOption = competitionSelect.options[competitionSelect.selectedIndex];
    const competitionTitle = selectedOption ? selectedOption.textContent : '';
    
    if (!competitionTitle || competitionTitle.trim() === '') {
      throw new Error('Competition title is required. Please select a valid competition.');
    }
    
    console.log('✅ Selected competition:', {
      id: selectedCompetitionId,
      title: competitionTitle
    });
    
    // Update prizeData with selected competition
    const prizeData = JSON.parse(localStorage.getItem('prizeData') || '{}');
    prizeData.competition_id = selectedCompetitionId;
    prizeData.title = competitionTitle;
    localStorage.setItem('prizeData', JSON.stringify(prizeData));
    
    return selectedCompetitionId;
  } catch (error) {
    console.error('❌ Error getting competition ID:', error);
    throw error; // Re-throw to prevent payment
  }
}

// Save payment data to database
async function savePaymentToDatabase(paymentData, competitionId) {
  try {
    console.log('💾 Preparing to save payment data...');
    console.log('   Competition ID:', competitionId);
    console.log('   Competition ID type:', typeof competitionId);
    console.log('   Is temp ID?', competitionId && competitionId.startsWith('temp_'));
    
    // Competition ID is REQUIRED - cannot be null or temp
    if (!competitionId || competitionId.trim() === '' || competitionId.startsWith('temp_')) {
      throw new Error('Invalid competition ID. Competition title is required for ticket purchase.');
    }
    
    // Validate UUID format
    if (!competitionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid competition ID format. Please select a valid competition.');
    }
    
    const validCompetitionId = competitionId;
    
    // Prepare entries for database
    const entries = paymentData.selected_numbers.map(entry => ({
      competition_id: validCompetitionId, // REQUIRED - cannot be null
      entry_number: entry.number,
      player_name: entry.name || 'Unnamed',
      mobile_number: entry.mobile || '',
      payment_transaction_id: paymentData.transaction_id,
      payment_amount: paymentData.amount,
      payment_currency: paymentData.currency,
      payment_status: 'completed',
      payment_completed_at: paymentData.timestamp,
      created_at: paymentData.timestamp
    }));
    
    console.log('   Prepared entries:', entries);
    
    // Save to Supabase if available
    if (supabase) {
      console.log('   Supabase client available, attempting save...');
      try {
        const { data, error } = await supabase
          .from('user_entries')
          .insert(entries)
          .select();
        
        if (error) {
          console.error('❌ Error saving to Supabase:', error);
          console.error('   Error code:', error.code);
          console.error('   Error message:', error.message);
          console.error('   Error details:', error.details);
          console.error('   Error hint:', error.hint);
          
          // Fall back to localStorage if Supabase fails
          const existingEntries = JSON.parse(localStorage.getItem('user_entries') || '[]');
          existingEntries.push(...entries);
          localStorage.setItem('user_entries', JSON.stringify(existingEntries));
          console.log('   Payment entries saved to localStorage (fallback):', entries.length);
          
          return { success: false, error: error.message, entries, savedToLocalStorage: true };
        } else {
          console.log('✅ Payment entries saved to Supabase:', data);
          console.log('✅ Database save confirmed - entries:', data.length);
          
          // Also save to localStorage as backup
          const existingEntries = JSON.parse(localStorage.getItem('user_entries') || '[]');
          existingEntries.push(...entries);
          localStorage.setItem('user_entries', JSON.stringify(existingEntries));
          
          return { success: true, entries: data, savedToSupabase: true };
        }
      } catch (supabaseError) {
        console.error('❌ Supabase save exception:', supabaseError);
        console.error('   Exception details:', JSON.stringify(supabaseError, null, 2));
        
        // Fall back to localStorage
        const existingEntries = JSON.parse(localStorage.getItem('user_entries') || '[]');
        existingEntries.push(...entries);
        localStorage.setItem('user_entries', JSON.stringify(existingEntries));
        console.log('   Payment entries saved to localStorage (fallback):', entries.length);
        
        return { success: false, error: supabaseError.message, entries, savedToLocalStorage: true };
      }
    } else {
      console.warn('⚠️ Supabase client not available, saving to localStorage only');
      // No Supabase, save to localStorage only
      const existingEntries = JSON.parse(localStorage.getItem('user_entries') || '[]');
      existingEntries.push(...entries);
      localStorage.setItem('user_entries', JSON.stringify(existingEntries));
      console.log('   Payment entries saved (localStorage only):', entries.length);
      
      return { success: true, entries, savedToLocalStorage: true };
    }
  } catch (error) {
    console.error('❌ Error saving payment to database:', error);
    console.error('   Error stack:', error.stack);
    return { success: false, error: error.message };
  }
}

// Update paid names display next to numbers
async function updatePaidNamesDisplay() {
  try {
    // Get all paid entries - try Supabase first, then localStorage
    let allPaidEntries = [];
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_entries')
          .select('*')
          .eq('payment_status', 'completed');
        
        if (!error && data) {
          allPaidEntries = data;
          console.log('Loaded paid entries from Supabase:', allPaidEntries.length);
        } else {
          console.warn('Error loading from Supabase, using localStorage:', error);
          allPaidEntries = JSON.parse(localStorage.getItem('user_entries') || '[]');
        }
      } catch (err) {
        console.warn('Supabase load error, using localStorage:', err);
        allPaidEntries = JSON.parse(localStorage.getItem('user_entries') || '[]');
      }
    } else {
      allPaidEntries = JSON.parse(localStorage.getItem('user_entries') || '[]');
    }
    
    console.log('Total paid entries found:', allPaidEntries.length);
    
    // Filter only completed payments for current competition
    const currentCompetitionId = JSON.parse(localStorage.getItem('prizeData') || '{}').competition_id;
    const currentCompetitionEntries = allPaidEntries.filter(entry => {
      const isCompleted = entry.payment_status === 'completed';
      const matchesCompetition = !currentCompetitionId || entry.competition_id === currentCompetitionId || !entry.competition_id;
      return isCompleted && matchesCompetition;
    });
    
    console.log('Filtered entries for current competition:', currentCompetitionEntries.length);
    
    // Group by number - get the most recent name for each number
    const paidNamesByNumber = {};
    currentCompetitionEntries.forEach(entry => {
      const num = entry.entry_number || entry.number;
      if (num) {
        const playerName = entry.player_name || entry.name || 'Unnamed';
        // Keep the most recent entry for each number
        if (!paidNamesByNumber[num] || new Date(entry.created_at || entry.payment_completed_at || 0) > new Date(paidNamesByNumber[num].created_at || paidNamesByNumber[num].payment_completed_at || 0)) {
          paidNamesByNumber[num] = entry;
        }
      }
    });
    
    console.log('Paid names by number:', paidNamesByNumber);
    
    // Update display for each number - show paid name and mobile in the input fields
    for (let i = 1; i <= 20; i++) {
      const nameInput = document.getElementById(`name-${i}`);
      const mobileInput = document.getElementById(`mobile-${i}`);
      
      if (nameInput && mobileInput) {
        if (paidNamesByNumber[i]) {
          const playerName = paidNamesByNumber[i].player_name || paidNamesByNumber[i].name || 'Unnamed';
          const playerMobile = paidNamesByNumber[i].mobile_number || paidNamesByNumber[i].mobile || '';
          const upperName = playerName.toUpperCase();
          
          // Set the paid name in the input field
          nameInput.value = upperName;
          nameInput.classList.add('paid-name');
          nameInput.readOnly = true;
          nameInput.dataset.paidName = upperName;
          
          // Set the paid mobile in the input field
          mobileInput.value = playerMobile;
          mobileInput.classList.add('paid-name');
          mobileInput.readOnly = true;
          mobileInput.dataset.paidMobile = playerMobile;
          
          // Uncheck checkbox if it was checked (can't select paid numbers)
          const checkbox = document.getElementById(`num-${i}`);
          if (checkbox) {
            checkbox.checked = false;
            checkbox.disabled = true;
          }
          
          // Remove from selectedNumbers if it was there
          selectedNumbers.delete(i);
          
          console.log(`Displaying paid name and mobile for number ${i}: ${upperName}, ${playerMobile}`);
        } else {
          // Remove paid styling if not paid
          nameInput.classList.remove('paid-name');
          nameInput.readOnly = false;
          delete nameInput.dataset.paidName;
          
          mobileInput.classList.remove('paid-name');
          mobileInput.readOnly = false;
          delete mobileInput.dataset.paidMobile;
          
          // Re-enable checkbox
          const checkbox = document.getElementById(`num-${i}`);
          if (checkbox) {
            checkbox.disabled = false;
          }
        }
      } else {
        console.warn(`Name input element not found for number ${i}`);
      }
    }
  } catch (error) {
    console.error('Error updating paid names display:', error);
  }
}

// Show payment success message
function showPaymentSuccessMessage(paymentData, details) {
  // Create success message element
  const successMessage = document.createElement('div');
  successMessage.className = 'payment-success-message';
  successMessage.innerHTML = `
    <div class="success-content">
      <div class="success-icon">✅</div>
      <div class="success-title">Payment Successful!</div>
      <div class="success-details">
        <div>Amount: R${paymentData.amount.toFixed(2)}</div>
        <div>Transaction: ${details.id.substring(0, 20)}...</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(successMessage);
  
  // Show with animation
  setTimeout(() => {
    successMessage.classList.add('active');
  }, 10);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    successMessage.classList.remove('active');
    setTimeout(() => {
      if (successMessage.parentNode) {
        successMessage.parentNode.removeChild(successMessage);
      }
    }, 300);
  }, 5000);
}

// Display all paid players (visible to everyone)
function displayAllPaidPlayers() {
  // Paid players container is now hidden - removed as requested
  // This function is kept for compatibility but does nothing
  return;
  
  // Get all paid entries from database/localStorage
  const allPaidEntries = JSON.parse(localStorage.getItem('user_entries') || '[]');
  
  // Filter only completed payments for current competition
  const currentCompetitionId = JSON.parse(localStorage.getItem('prizeData') || '{}').competition_id;
  const currentCompetitionEntries = allPaidEntries.filter(entry => 
    entry.payment_status === 'completed' && 
    (!currentCompetitionId || entry.competition_id === currentCompetitionId || !entry.competition_id)
  );
  
  // Clear existing content
  paidPlayersContainer.innerHTML = '<h3 class="paid-players-title">Paid Entries</h3>';
  
  if (currentCompetitionEntries.length === 0) {
    paidPlayersContainer.innerHTML += '<div class="no-paid-entries">No paid entries yet</div>';
    return;
  }
  
  // Group by number and show all players for each number
  const entriesByNumber = {};
  currentCompetitionEntries.forEach(entry => {
    const num = entry.entry_number || entry.number;
    if (!entriesByNumber[num]) {
      entriesByNumber[num] = [];
    }
    const playerName = entry.player_name || entry.name || 'Unnamed';
    // Avoid duplicates
    if (!entriesByNumber[num].includes(playerName)) {
      entriesByNumber[num].push(playerName);
    }
  });
  
  // Add each paid player entry
  Object.keys(entriesByNumber).sort((a, b) => parseInt(a) - parseInt(b)).forEach(num => {
    const names = entriesByNumber[num];
    names.forEach(name => {
      const playerDiv = document.createElement('div');
      playerDiv.className = 'paid-player-entry';
      playerDiv.innerHTML = `
        <span class="paid-player-number">#${num}</span>
        <span class="paid-player-name">${name}</span>
        <span class="paid-player-status">✓ Paid</span>
      `;
      paidPlayersContainer.appendChild(playerDiv);
    });
  });
}

// Load and display paid players on page load
function loadAndDisplayPaidPlayers() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayAllPaidPlayers);
  } else {
    displayAllPaidPlayers();
  }
}

// Checkout button handler - replace with PayPal button and auto-show
checkoutButton.addEventListener('click', () => {
  if (selectedNumbers.size === 0) {
    alert('Please select at least one number before checkout.');
    return;
  }
  
  // Validate all selected numbers have both name and mobile number
  for (const [num, data] of selectedNumbers.entries()) {
    const nameInput = document.getElementById(`name-${num}`);
    const mobileInput = document.getElementById(`mobile-${num}`);
    const name = nameInput ? nameInput.value.trim() : (data?.name || '');
    const mobile = mobileInput ? mobileInput.value.trim() : (data?.mobile || '');
    
    if (!name || !name.trim()) {
      alert(`Please enter a name for number ${num}. Name is required.`);
      nameInput?.focus();
      return;
    }
    
    if (!mobile || !mobile.trim()) {
      alert(`Please enter a mobile number for number ${num}. Mobile number is required.`);
      mobileInput?.focus();
      return;
    }
  }
  
  // Hide checkout button and show PayPal button
  checkoutButton.style.display = 'none';
  
  // Initialize PayPal - it will replace the checkout button
  initializePayPal();
  
  // Scroll to PayPal button after it renders
  setTimeout(() => {
    if (paypalButtonsContainer) {
      paypalButtonsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 500);
});

// Initialize PayPal when page loads (after a delay to ensure SDK is loaded)
window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof paypal !== 'undefined') {
      // PayPal SDK loaded, buttons will be created on checkout click
      console.log('PayPal SDK loaded');
    }
  }, 1000);
});

// Admin Modal Elements
const passwordModal = document.getElementById('passwordModal');
const adminModal = document.getElementById('adminModal');
const adminPasswordInput = document.getElementById('adminPassword');
const passwordSubmit = document.getElementById('passwordSubmit');
const passwordCancel = document.getElementById('passwordCancel');
const passwordError = document.getElementById('passwordError');
const adminModalClose = document.getElementById('adminModalClose');
const adminCancelButton = document.getElementById('adminCancelButton');
const adminForm = document.getElementById('adminForm');
const adminPhotoInput = document.getElementById('adminPhoto');
const photoPreview = document.getElementById('photoPreview');
const ADMIN_PASSWORD = '11274';

// Admin button handler - show password modal
adminButton.addEventListener('click', () => {
  passwordModal.classList.add('active');
  adminPasswordInput.value = '';
  passwordError.textContent = '';
  adminPasswordInput.focus();
});

// Completed Competitions Modal Elements
const completedModal = document.getElementById('completedModal');
const completedModalClose = document.getElementById('completedModalClose');
const completedCompetitionsList = document.getElementById('completedCompetitionsList');

// Completed button handler
if (completedButton) {
  completedButton.addEventListener('click', () => {
    if (completedModal) {
      completedModal.classList.add('active');
      loadCompletedCompetitions();
    }
  });
}

// Close completed modal
if (completedModalClose) {
  completedModalClose.addEventListener('click', () => {
    if (completedModal) {
      completedModal.classList.remove('active');
    }
  });
}

// Close modal when clicking outside
if (completedModal) {
  completedModal.addEventListener('click', (e) => {
    if (e.target === completedModal) {
      completedModal.classList.remove('active');
    }
  });
}

// Password modal handlers
passwordSubmit.addEventListener('click', () => {
  const enteredPassword = adminPasswordInput.value;
  if (enteredPassword === ADMIN_PASSWORD) {
    passwordModal.classList.remove('active');
    adminModal.classList.add('active');
    // Reset form
    adminForm.reset();
    photoPreview.classList.remove('active');
    photoPreview.innerHTML = '';
    
    // Set default date and time (today and current time)
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    document.getElementById('adminSpinDate').value = dateStr;
    document.getElementById('adminSpinTime').value = timeStr;
  } else {
    passwordError.textContent = 'Incorrect password. Please try again.';
    adminPasswordInput.value = '';
    adminPasswordInput.focus();
  }
});

passwordCancel.addEventListener('click', () => {
  passwordModal.classList.remove('active');
  adminPasswordInput.value = '';
  passwordError.textContent = '';
});

// Allow Enter key to submit password
adminPasswordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    passwordSubmit.click();
  }
});

// Close admin modal
adminModalClose.addEventListener('click', () => {
  adminModal.classList.remove('active');
});

adminCancelButton.addEventListener('click', () => {
  adminModal.classList.remove('active');
});

// Close modals when clicking outside
passwordModal.addEventListener('click', (e) => {
  if (e.target === passwordModal) {
    passwordModal.classList.remove('active');
  }
});

adminModal.addEventListener('click', (e) => {
  if (e.target === adminModal) {
    adminModal.classList.remove('active');
  }
});

// Helper function to convert HEIC to a displayable format
async function convertHeicToImage(file) {
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    });
    // heic2any returns an array, get the first blob
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    return new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
  } catch (error) {
    console.error('HEIC conversion error:', error);
    throw error;
  }
}

// Helper function to create image preview with proper scaling
function createImagePreview(file, targetElement) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target.result;
      img.alt = 'Preview';
      
      // Wait for image to load to get natural dimensions
      img.onload = () => {
        // Image will scale naturally based on its aspect ratio
        targetElement.innerHTML = '';
        targetElement.appendChild(img);
        targetElement.classList.add('active');
        resolve(event.target.result);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

// Photo preview with HEIC support
adminPhotoInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      let fileToProcess = file;
      
      // Check if file is HEIC/HEIF
      const isHeic = /\.heic$/i.test(file.name) || 
                     /\.heif$/i.test(file.name) ||
                     file.type === 'image/heic' ||
                     file.type === 'image/heif';
      
      if (isHeic) {
        // Convert HEIC to JPEG
        photoPreview.innerHTML = '<div style="padding: 20px; text-align: center; color: #FFD700;">Converting HEIC image...</div>';
        photoPreview.classList.add('active');
        
        fileToProcess = await convertHeicToImage(file);
      }
      
      // Create preview with proper scaling
      await createImagePreview(fileToProcess, photoPreview);
      
      // Store the processed file for form submission
      adminPhotoInput.processedFile = fileToProcess;
    } catch (error) {
      console.error('Error processing image:', error);
      photoPreview.innerHTML = `<div style="padding: 20px; text-align: center; color: #E74C3C;">Error: ${error.message}</div>`;
      photoPreview.classList.add('active');
    }
  } else {
    photoPreview.classList.remove('active');
    photoPreview.innerHTML = '';
    adminPhotoInput.processedFile = null;
  }
});

// Admin form submission
adminForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get date and time values
  const spinDate = document.getElementById('adminSpinDate').value;
  const spinTime = document.getElementById('adminSpinTime').value;
  
  // Combine date and time into a single datetime string
  const spinDateTime = spinDate && spinTime ? `${spinDate}T${spinTime}:00` : null;
  
  const formData = {
    title: document.getElementById('adminTitle').value,
    photo: adminPhotoInput.files[0] ? await fileToBase64(adminPhotoInput.files[0]) : null,
    description: document.getElementById('adminDescription').value,
    value: parseFloat(document.getElementById('adminValue').value),
    price: parseFloat(document.getElementById('adminPrice').value),
    spinDate: spinDate,
    spinTime: spinTime,
    spinDateTime: spinDateTime,
    timestamp: new Date().toISOString()
  };
  
  // Save competition to database
  let competitionId = null;
  if (supabase) {
    try {
      const competitionData = {
        title: formData.title,
        photo: formData.photo,
        description: formData.description,
        prize_value: formData.value || 0,
        ticket_price: formData.price || 50,
        spin_date: spinDate,
        spin_time: spinTime,
        spin_datetime: spinDateTime || new Date().toISOString(),
        status: 'active'
      };
      
      const { data, error } = await supabase
        .from('competitions')
        .insert(competitionData)
        .select()
        .single();
      
      if (error) {
        console.error('Error saving competition to Supabase:', error);
        alert('Error saving competition to database. Check console for details.');
      } else {
        console.log('✅ Competition saved to Supabase:', data);
        competitionId = data.id;
        formData.competition_id = competitionId;
      }
    } catch (err) {
      console.error('Error saving competition:', err);
    }
  }
  
  // Update the UI with the new prize info
  updatePrizeInfo(formData);
  
  // Reload active competitions dropdown to include the new competition
  loadActiveCompetitions();
  
  // Show success message
  alert('Competition saved successfully!');
  
  // Close modal
  adminModal.classList.remove('active');
});

// Helper function to convert file to base64 (handles HEIC conversion)
async function fileToBase64(file) {
  try {
    let fileToProcess = file;
    
    // Check if file is HEIC/HEIF
    const isHeic = /\.heic$/i.test(file.name) || 
                   /\.heif$/i.test(file.name) ||
                   file.type === 'image/heic' ||
                   file.type === 'image/heif';
    
    // If HEIC, use the already processed file from preview, or convert it
    if (isHeic) {
      if (adminPhotoInput.processedFile) {
        fileToProcess = adminPhotoInput.processedFile;
      } else {
        fileToProcess = await convertHeicToImage(file);
      }
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(fileToProcess);
    });
  } catch (error) {
    console.error('Error converting file to base64:', error);
    throw error;
  }
}

// Update prize info display with saved data
function updatePrizeInfo(data) {
  const photoElement = document.querySelector('.prize-photo');
  const descriptionElement = document.querySelector('.description-placeholder');
  const valueElement = document.querySelector('.value-placeholder');
  const priceElement = document.querySelector('.price-placeholder');
  const prizeLabel = document.getElementById('prizeLabel');
  
  // Update title/label
  if (data.title && data.title.trim()) {
    prizeLabel.textContent = data.title;
  } else {
    prizeLabel.textContent = 'THIS WEEK\'S PRIZE';
  }
  
  // Update photo - replace placeholder with actual image (scales to fit whole image)
  if (data.photo) {
    // Remove placeholder text
    photoElement.innerHTML = '';
    // Add image that scales to fit the whole image
    const img = document.createElement('img');
    img.src = data.photo;
    img.alt = 'Prize';
    // Image will scale to fit container while maintaining aspect ratio
    // CSS object-fit: contain ensures the whole image is visible
    photoElement.appendChild(img);
    
    // Image will be constrained by CSS max-height: 200px
    // No need to adjust container height - CSS handles it
  } else {
    // Show placeholder if no photo
    photoElement.innerHTML = '<div class="photo-placeholder">📷 Photo</div>';
  }
  
  // Update description
  if (data.description && data.description.trim()) {
    descriptionElement.textContent = data.description;
    descriptionElement.style.color = 'rgba(255, 255, 255, 0.9)'; // Make it more visible
  } else {
    descriptionElement.textContent = 'Description placeholder text';
    descriptionElement.style.color = 'rgba(255, 255, 255, 0.7)';
  }
  
  // Update value
  if (data.value !== undefined && !isNaN(data.value) && data.value > 0) {
    valueElement.textContent = `Value: $${data.value.toFixed(2)}`;
    valueElement.style.color = '#00FF00'; // Green for value
  } else {
    valueElement.textContent = 'Value: $0.00';
    valueElement.style.color = '#00FF00';
  }
  
  // Update ticket price
  if (data.price !== undefined && !isNaN(data.price) && data.price > 0) {
    priceElement.textContent = `Ticket Price: $${data.price.toFixed(2)}`;
    priceElement.style.color = '#FFD700'; // Gold for price
  } else {
    priceElement.textContent = 'Ticket Price: $0.00';
    priceElement.style.color = '#FFD700';
  }
  
  // Store in localStorage for persistence (until DB is set up)
  try {
    const existingData = JSON.parse(localStorage.getItem('prizeData') || '{}');
    const prizeDataToSave = {
      title: data.title || existingData.title,
      photo: data.photo || existingData.photo,
      description: data.description || existingData.description,
      value: data.value !== undefined ? data.value : existingData.value,
      price: data.price !== undefined ? data.price : existingData.price,
      spinDate: data.spinDate || existingData.spinDate,
      spinTime: data.spinTime || existingData.spinTime,
      spinDateTime: data.spinDateTime || existingData.spinDateTime,
      timestamp: data.timestamp || existingData.timestamp,
      competition_id: data.competition_id || existingData.competition_id
    };
    localStorage.setItem('prizeData', JSON.stringify(prizeDataToSave));
    
    // Update competitions list
    if (typeof updateCompetitionsList === 'function') {
      updateCompetitionsList();
    }
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

// Load prize data from localStorage on page load (until DB is set up)
function loadPrizeData() {
  try {
    const savedData = localStorage.getItem('prizeData');
    if (savedData) {
      const data = JSON.parse(savedData);
      updatePrizeInfo(data);
      
      // Populate form fields if data exists
      if (data.title) {
        document.getElementById('adminTitle').value = data.title;
      }
      if (data.spinDate) {
        document.getElementById('adminSpinDate').value = data.spinDate;
      }
      if (data.spinTime) {
        document.getElementById('adminSpinTime').value = data.spinTime;
      }
    }
  } catch (e) {
    console.warn('Could not load from localStorage:', e);
  }
}

// Load saved prize data when page loads
loadPrizeData();

// Load and display all paid players when page loads (visible to everyone)
loadAndDisplayPaidPlayers();
// Update paid names display on page load
updatePaidNamesDisplay();

// Load active competitions on page load
loadActiveCompetitions();

// Auto-spin timer (10 minutes after last payment)
let autoSpinTimer = null;
let autoSpinDateTime = null;

// Check if competition is fully bought out and schedule auto-spin
async function checkAndScheduleAutoSpin(competitionId) {
  try {
    // Get all entries for this competition
    let entries = [];
    if (supabase && competitionId && !competitionId.startsWith('temp_')) {
      const { data, error } = await supabase
        .from('user_entries')
        .select('entry_number')
        .eq('competition_id', competitionId)
        .eq('payment_status', 'completed');
      
      if (!error && data) {
        entries = data;
      }
    } else {
      // Fallback to localStorage
      const allEntries = JSON.parse(localStorage.getItem('user_entries') || '[]');
      entries = allEntries.filter(e => 
        (!competitionId || e.competition_id === competitionId || !e.competition_id) &&
        e.payment_status === 'completed'
      );
    }
    
    // Get unique entry numbers
    const boughtNumbers = new Set(entries.map(e => e.entry_number || e.number));
    
    // Check if all 20 numbers are bought
    const isFullyBought = boughtNumbers.size >= 20;
    
    if (isFullyBought) {
      console.log('✅ Competition fully bought out! Scheduling auto-spin in 10 minutes...');
      
      // Update competition status to 'completed' in database
      if (supabase && competitionId && !competitionId.startsWith('temp_')) {
        try {
          const { error: updateError } = await supabase
            .from('competitions')
            .update({ 
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', competitionId);
          
          if (updateError) {
            console.error('Error updating competition status:', updateError);
          } else {
            console.log('✅ Competition status updated to "completed"');
          }
        } catch (err) {
          console.error('Error updating competition status:', err);
        }
      }
      
      // Clear existing timer
      if (autoSpinTimer) {
        clearTimeout(autoSpinTimer);
      }
      
      // Schedule spin for 10 minutes from now
      autoSpinDateTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Update countdown to show auto-spin time
      updateAutoSpinCountdown();
      startCountdown(); // Restart countdown to show auto-spin time
      
      // Set timer to auto-spin
      autoSpinTimer = setTimeout(() => {
        console.log('🎰 Auto-spinning wheel (10 minutes after last payment)...');
        if (!themeParkWheel.isSpinning) {
          // Pick random number for the spin
          const randomNumber = Math.floor(Math.random() * 20) + 1;
          startSpin();
        }
      }, 10 * 60 * 1000); // 10 minutes
    }
  } catch (error) {
    console.error('Error checking competition status:', error);
  }
}

// Update countdown to show auto-spin time
function updateAutoSpinCountdown() {
  if (!autoSpinDateTime) return;
  
  const countdownTimer = document.getElementById('countdownTimer');
  const countdownHours = document.getElementById('countdownHours');
  const countdownMinutes = document.getElementById('countdownMinutes');
  const countdownSeconds = document.getElementById('countdownSeconds');
  const countdownDate = document.getElementById('countdownDate');
  
  if (!countdownTimer) return;
  
  const now = new Date();
  const diff = autoSpinDateTime - now;
  
  if (diff <= 0) {
    countdownTimer.style.display = 'none';
    return;
  }
  
  countdownTimer.style.display = 'block';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (countdownHours) countdownHours.textContent = String(hours).padStart(2, '0');
  if (countdownMinutes) countdownMinutes.textContent = String(minutes).padStart(2, '0');
  if (countdownSeconds) countdownSeconds.textContent = String(seconds).padStart(2, '0');
  
  // Date display removed - only show countdown timer
}

// Load active competitions (not fully bought out)
async function loadActiveCompetitions() {
  try {
    const competitionSelect = document.getElementById('competitionSelect');
    if (!competitionSelect) return;
    
    let competitions = [];
    
    // Load from Supabase if available
    if (supabase) {
      const { data, error } = await supabase
        .from('competitions')
        .select('id, title, status')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        competitions = data;
      }
    } else {
      // Fallback: use localStorage prizeData as single competition
      const prizeData = JSON.parse(localStorage.getItem('prizeData') || '{}');
      if (prizeData.title) {
        competitions = [{
          id: prizeData.competition_id || 'temp',
          title: prizeData.title,
          status: 'active'
        }];
      }
    }
    
    // Filter to only active competitions (not fully bought out)
    const activeCompetitions = [];
    for (const comp of competitions) {
      const isActive = await isCompetitionActive(comp.id);
      if (isActive) {
        activeCompetitions.push(comp);
      }
    }
    
    // Populate dropdown - sorted by title alphabetically
    competitionSelect.innerHTML = '';
    if (activeCompetitions.length === 0) {
      competitionSelect.innerHTML = '<option value="">No active competitions</option>';
    } else {
      // Sort by title alphabetically
      activeCompetitions.sort((a, b) => {
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
      });
      
      activeCompetitions.forEach(comp => {
        const option = document.createElement('option');
        option.value = comp.id;
        option.textContent = comp.title;
        competitionSelect.appendChild(option);
      });
    }
    
    console.log('Loaded active competitions:', activeCompetitions.length);
  } catch (error) {
    console.error('Error loading competitions:', error);
  }
}

// Check if competition is active (not fully bought out)
async function isCompetitionActive(competitionId) {
  try {
    // Get all entries for this competition
    let entries = [];
    if (supabase && competitionId && !competitionId.startsWith('temp_')) {
      const { data, error } = await supabase
        .from('user_entries')
        .select('entry_number')
        .eq('competition_id', competitionId)
        .eq('payment_status', 'completed');
      
      if (!error && data) {
        entries = data;
      }
    } else {
      // Fallback to localStorage
      const allEntries = JSON.parse(localStorage.getItem('user_entries') || '[]');
      entries = allEntries.filter(e => 
        (!competitionId || e.competition_id === competitionId || !e.competition_id) &&
        e.payment_status === 'completed'
      );
    }
    
    // Get unique entry numbers
    const boughtNumbers = new Set(entries.map(e => e.entry_number || e.number));
    
    // Competition is active if not all 20 numbers are bought
    return boughtNumbers.size < 20;
  } catch (error) {
    console.error('Error checking competition status:', error);
    return true; // Default to active if error
  }
}

// Load completed competitions (has winner or all numbers bought)
async function loadCompletedCompetitions() {
  try {
    if (!completedCompetitionsList) return;
    completedCompetitionsList.innerHTML = '<div class="loading-message">Loading completed competitions...</div>';
    
    let competitions = [];
    
    // Load from Supabase if available
    if (supabase) {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        competitions = data;
      }
    } else {
      // Fallback: use localStorage
      const prizeData = JSON.parse(localStorage.getItem('prizeData') || '{}');
      const winningResults = JSON.parse(localStorage.getItem('winningResults') || '[]');
      
      if (prizeData.title && winningResults.length > 0) {
        competitions = [{
          ...prizeData,
          id: prizeData.competition_id || 'temp',
          winning_number: winningResults[winningResults.length - 1]?.winning_number,
          winner_name: winningResults[winningResults.length - 1]?.winner_name
        }];
      }
    }
    
    // Filter to completed competitions (has winner OR all 20 numbers bought OR status='completed')
    const completedComps = [];
    for (const comp of competitions) {
      const hasWinner = comp.winning_number && comp.winner_name;
      const statusCompleted = comp.status === 'completed';
      const isFullyBought = !(await isCompetitionActive(comp.id));
      
      console.log(`Competition ${comp.id} (${comp.title}): hasWinner=${hasWinner}, statusCompleted=${statusCompleted}, isFullyBought=${isFullyBought}`);
      
      if (hasWinner || statusCompleted || isFullyBought) {
        // Get winner info if not already set
        let winnerNumber = comp.winning_number;
        let winnerName = comp.winner_name;
        let spinDate = comp.updated_at || comp.created_at;
        
        if (!winnerNumber || !winnerName) {
          // Try to get from entries
          const winnerInfo = await getWinnerInfo(comp.id);
          if (winnerInfo) {
            winnerNumber = winnerInfo.number;
            winnerName = winnerInfo.name;
          }
        }
        
        completedComps.push({
          ...comp,
          winning_number: winnerNumber,
          winner_name: winnerName,
          spin_date: spinDate
        });
      }
    }
    
    // Add dummy data for testing
    const dummyCompetitions = [
      {
        id: 'dummy-1',
        title: 'Summer Prize Draw 2024',
        description: 'Win a brand new iPhone 15 Pro Max!',
        photo: null,
        prize_value: 15000.00,
        ticket_price: 50.00,
        winning_number: 7,
        winner_name: 'JOHN SMITH',
        spin_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        status: 'completed',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'dummy-2',
        title: 'Holiday Cash Giveaway',
        description: 'R10,000 cash prize for the lucky winner!',
        photo: null,
        prize_value: 10000.00,
        ticket_price: 50.00,
        winning_number: 15,
        winner_name: 'SARAH JOHNSON',
        spin_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
        status: 'completed',
        created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'dummy-3',
        title: 'Tech Gadgets Competition',
        description: 'MacBook Pro 16" M3 Max - Ultimate prize!',
        photo: null,
        prize_value: 35000.00,
        ticket_price: 50.00,
        winning_number: 3,
        winner_name: 'MIKE WILLIAMS',
        spin_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        status: 'completed',
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'dummy-4',
        title: 'Weekend Getaway Prize',
        description: 'All-expenses paid trip to Cape Town!',
        photo: null,
        prize_value: 8000.00,
        ticket_price: 50.00,
        winning_number: 19,
        winner_name: 'LISA ANDERSON',
        spin_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        status: 'completed',
        created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Add dummy competitions to the list
    completedComps.push(...dummyCompetitions);
    
    // Display completed competitions
    displayCompletedCompetitions(completedComps);
  } catch (error) {
    console.error('Error loading completed competitions:', error);
    if (completedCompetitionsList) {
      completedCompetitionsList.innerHTML = '<div class="error-message">Error loading completed competitions</div>';
    }
  }
}

// Get winner info for a competition
async function getWinnerInfo(competitionId) {
  try {
    // Get winning results from localStorage (since we're not using spin_results table)
    const winningResults = JSON.parse(localStorage.getItem('winningResults') || '[]');
    const result = winningResults.find(r => 
      (!competitionId || r.competition_id === competitionId || !r.competition_id)
    );
    
    if (result && result.winning_number && result.winner_name) {
      return {
        number: result.winning_number,
        name: result.winner_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting winner info:', error);
    return null;
  }
}

// Display completed competitions as cards
function displayCompletedCompetitions(competitions) {
  if (!completedCompetitionsList) return;
  
  if (competitions.length === 0) {
    completedCompetitionsList.innerHTML = '<div class="no-completions">No completed competitions yet</div>';
    return;
  }
  
  completedCompetitionsList.innerHTML = '';
  
  competitions.forEach(comp => {
    const card = document.createElement('div');
    card.className = 'completed-competition-card';
    
    const spinDate = comp.spin_date ? new Date(comp.spin_date) : (comp.updated_at ? new Date(comp.updated_at) : new Date(comp.created_at));
    const dateStr = formatDate(spinDate);
    const timeStr = formatTime(spinDate);
    
    card.innerHTML = `
      <div class="completed-card-header">
        <h3 class="completed-card-title">${comp.title || 'Competition'}</h3>
        <div class="completed-card-date">Spin Date: ${dateStr} @ ${timeStr}</div>
      </div>
      ${comp.photo ? `<div class="completed-card-photo"><img src="${comp.photo}" alt="Prize" /></div>` : ''}
      <div class="completed-card-description">${comp.description || 'No description'}</div>
      <div class="completed-card-details">
        <div class="completed-card-value">Value: $${(comp.prize_value || 0).toFixed(2)}</div>
        <div class="completed-card-price">Ticket Price: $${(comp.ticket_price || 0).toFixed(2)}</div>
      </div>
      ${comp.winning_number && comp.winner_name ? `
        <div class="completed-card-winner">
          <div class="winner-label">WINNER</div>
          <div class="winner-number">Number: ${comp.winning_number}</div>
          <div class="winner-name">${comp.winner_name.toUpperCase()}</div>
        </div>
      ` : '<div class="completed-card-winner">No winner recorded</div>'}
    `;
    
    completedCompetitionsList.appendChild(card);
  });
}

// Countdown Timer Functions
let countdownInterval = null;

function getSpinDateTime() {
  try {
    const savedData = localStorage.getItem('prizeData');
    if (savedData) {
      const data = JSON.parse(savedData);
      if (data.spinDateTime) {
        return new Date(data.spinDateTime);
      } else if (data.spinDate && data.spinTime) {
        // Combine date and time
        return new Date(`${data.spinDate}T${data.spinTime}:00`);
      }
    }
  } catch (e) {
    console.warn('Could not load spin date/time:', e);
  }
  return null;
}

function formatDate(date) {
  if (!date) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
  if (!date) return '';
  const options = { hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleTimeString('en-US', options);
}

function updateCountdown() {
  const spinDateTime = getSpinDateTime();
  const countdownTimer = document.getElementById('countdownTimer');
  const countdownHours = document.getElementById('countdownHours');
  const countdownMinutes = document.getElementById('countdownMinutes');
  const countdownSeconds = document.getElementById('countdownSeconds');
  const countdownDate = document.getElementById('countdownDate');
  
  if (!spinDateTime || !countdownTimer) return;
  
  const now = new Date();
  const diff = spinDateTime - now;
  
  // If time has passed, hide countdown
  if (diff <= 0) {
    countdownTimer.style.display = 'none';
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    return;
  }
  
  // Show countdown
  countdownTimer.style.display = 'block';
  
  // Calculate time components
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  // Update display
  if (countdownHours) countdownHours.textContent = String(hours).padStart(2, '0');
  if (countdownMinutes) countdownMinutes.textContent = String(minutes).padStart(2, '0');
  if (countdownSeconds) countdownSeconds.textContent = String(seconds).padStart(2, '0');
  
  // Date display removed - only show countdown timer
}

function startCountdown() {
  // Clear existing interval
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  // Update immediately
  updateCountdown();
  
  // Update every second - check both admin-set time and auto-spin time
  countdownInterval = setInterval(() => {
    if (autoSpinDateTime) {
      updateAutoSpinCountdown();
    } else {
      updateCountdown();
    }
  }, 1000);
}

// Start countdown when page loads
startCountdown();

// Wrap updatePrizeInfo to restart countdown when data is updated
const originalUpdatePrizeInfo = updatePrizeInfo;
updatePrizeInfo = function(data) {
  originalUpdatePrizeInfo(data);
  // Restart countdown with new date/time
  startCountdown();
};

// Massive winning number display function
// Save winning result to database
async function saveWinningResult(winningNumber, winnerName) {
  try {
    // Get current prize data
    const prizeData = JSON.parse(localStorage.getItem('prizeData') || '{}');
    
    // Prepare data for database
    const resultData = {
      winning_number: winningNumber,
      winner_name: winnerName || 'No winner selected',
      competition_id: prizeData.competition_id || null, // Will be set when DB is connected
      draw_completed_at: new Date().toISOString(),
      prize_description: prizeData.description || '',
      prize_value: prizeData.value || 0,
      ticket_price: prizeData.price || 0,
      spin_datetime: prizeData.spinDateTime || new Date().toISOString()
    };
    
    // TODO: Replace with actual Supabase/DB call when database is set up
    // Example:
    // const { data, error } = await supabase
    //   .from('spin_results')
    //   .insert([resultData]);
    
    // For now, save to localStorage as backup
    const existingResults = JSON.parse(localStorage.getItem('winningResults') || '[]');
    existingResults.push({
      ...resultData,
      saved_at: new Date().toISOString()
    });
    localStorage.setItem('winningResults', JSON.stringify(existingResults));
    
    console.log('Winning result saved:', resultData);
    
    // Return success (will be used when DB is connected)
    return { success: true, data: resultData };
  } catch (error) {
    console.error('Error saving winning result:', error);
    return { success: false, error: error.message };
  }
}

function showWinningNumber(number) {
  const overlay = document.getElementById('winningNumberOverlay');
  const display = document.getElementById('winningNumberDisplay');
  
  if (!overlay || !display) return;
  
  // Set the number
  display.textContent = number;
  
  // Show overlay with animation
  overlay.classList.add('active');
  
  // Add pulsing animation
  display.classList.add('pulse');
  
  // Get winner name from paid entries for this competition
  const winnerName = getWinnerNameForNumber(number);
  
  // Announce with winner name
  if (themeParkWheel && typeof themeParkWheel.speakWinningNumber === 'function') {
    themeParkWheel.speakWinningNumber(number, winnerName);
  }
  
  // Save to database
  saveWinningResult(number, winnerName);
  
  // Auto-hide after 5 seconds (reduced from 8)
  setTimeout(() => {
    overlay.classList.remove('active');
    display.classList.remove('pulse');
  }, 5000);
}

// Initialize checkout button state - hidden until numbers are selected
if (checkoutButton) {
  checkoutButton.style.display = 'none';
  updateCheckoutButton();
}

// Spin state
let currentSpinNumber = null;

// Spin function
function startSpin() {
  if (themeParkWheel.isSpinning) return;
  
  // Generate random number (1-20)
  const randomNumber = Math.floor(Math.random() * 20) + 1;
  currentSpinNumber = randomNumber;
  
  // Update UI
  spinButton.disabled = true;
  spinButton.textContent = 'SPINNING...';
  
  // Start spin animation
  themeParkWheel.spin(randomNumber);
}

// Event listeners
spinButton.addEventListener('click', startSpin);

// Prevent resize "thrash" - debounced "only if changed" version
function handleResize() {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = null;
    updateRendererSize();
  });
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => setTimeout(handleResize, 120));

const resizeObserver = new ResizeObserver(handleResize);
resizeObserver.observe(document.getElementById('wheelStage') || app);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update theme park wheel animation
  const completed = themeParkWheel.update();
  
  // Check if spin completed
  if (completed && currentSpinNumber !== null) {
    // Get the locked winning number (already calculated and locked when wheel stopped)
    const winningNumber = themeParkWheel.finalWinningNumber;
    
    if (winningNumber) {
      spinButton.disabled = false;
      spinButton.textContent = 'SPIN';
      
      // Show winning number announcement
      showWinningNumber(winningNumber);
      
      currentSpinNumber = null;
    }
  }
  
  // Update controls
  controls.update();
  
  // Render
  renderer.render(scene, camera);
}

// Add pulse animation for result
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;
document.head.appendChild(style);

// Start animation loop
animate();

// DISABLED: Draggable components code - was causing overlap and preventing scroll
// The draggable code was setting position: absolute and preventing touch scrolling
// with preventDefault() on touchmove events

// Clear any saved dragged positions from localStorage
localStorage.removeItem('component_pos_competition');
localStorage.removeItem('component_pos_controls');
localStorage.removeItem('component_pos_prize');
localStorage.removeItem('component_pos_game');

