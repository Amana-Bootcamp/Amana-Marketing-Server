const express = require('express')
const fs = require('fs')
const path = require('path')
const { simpleDecrypt } = require('./auth/decrypt.js')

const app = express()
const port = 3000






// ============================================================


// Request Logger
const requestLogger = require('./logging/logger.js')

// Use imported Morgan request logger
app.use(requestLogger)

// Middleware for parsing JSON and URL-encoded data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


// ============================================================




// Example: GET http://localhost:3000/
app.get('/', (req, res) => {
  res.send('Hello World!')
})




// ============================================================




// DATA ACCESS BASIC
// ------------------------------------------------------------
// Get the Full Data File
// Example: GET http://localhost:3000/full-data
app.get('/full-data', (req, res) => {
  res.sendFile(__dirname + '/data/marketing-data.json')
})

// Get campaign data filtered by ID
// Example: GET http://localhost:3000/campaign-data?campaignId=2
app.get('/campaign-data', (req, res) => {
  const { campaignId } = req.query
  
  if (!campaignId) {
    return res.status(400).json({
      error: "Missing campaign ID",
      message: "campaignId query parameter is required"
    })
  }

  // Convert campaignId to number since IDs in JSON are numeric
  const numericCampaignId = parseInt(campaignId, 10)
  
  if (isNaN(numericCampaignId)) {
    return res.status(400).json({
      error: "Invalid campaign ID",
      message: "campaignId must be a valid number"
    })
  }

  const data = JSON.parse(fs.readFileSync(__dirname + '/data/marketing-data.json', 'utf8'))
  const campaign = data.campaigns.find(c => c.id === numericCampaignId)
  
  if (!campaign) {
    return res.status(404).json({
      error: "Campaign not found",
      message: "No campaign found with the provided ID"
    })
  }
  
  res.json(campaign)
})

// Get campaigns filtered by region
// Example: GET http://localhost:3000/region-data?region=Dubai
app.get('/region-data', (req, res) => {
  const { region } = req.query
  
  if (!region) {
    return res.status(400).json({
      error: "Missing region",
      message: "region query parameter is required"
    })
  }

  const data = JSON.parse(fs.readFileSync(__dirname + '/data/marketing-data.json', 'utf8'))
  
  // Extract regional performance data for the specified region from each campaign
  const regionalData = []
  
  data.campaigns.forEach(campaign => {
    if (campaign.regional_performance) {
      const regionPerformance = campaign.regional_performance.find(rp => rp.region === region)
      if (regionPerformance) {
        regionalData.push({
          campaign: campaign.id.toString(),
          name: campaign.name,
          region: regionPerformance.region,
          country: regionPerformance.country,
          impressions: regionPerformance.impressions,
          clicks: regionPerformance.clicks,
          conversions: regionPerformance.conversions,
          spend: regionPerformance.spend,
          revenue: regionPerformance.revenue,
          ctr: regionPerformance.ctr,
          conversion_rate: regionPerformance.conversion_rate,
          cpc: regionPerformance.cpc,
          cpa: regionPerformance.cpa,
          roas: regionPerformance.roas
        })
      }
    }
  })
  
  if (regionalData.length === 0) {
    return res.status(404).json({
      error: "No campaigns found",
      message: `No campaigns found for region: ${region}`
    })
  }
  
  res.json(regionalData)
})

// Get creative performance data by creative IDs
// Example: POST http://localhost:3000/creative-data
// Body: { "creativeIds": [101, 102, 201] }
app.post('/creative-data', (req, res) => {
  const { creativeIds } = req.body
  
  if (!creativeIds || !Array.isArray(creativeIds)) {
    return res.status(400).json({
      error: "Missing or invalid creative IDs",
      message: "creativeIds must be provided as an array in the request body",
      example: { "creativeIds": [101, 102, 201] }
    })
  }

  if (creativeIds.length === 0) {
    return res.status(400).json({
      error: "Empty creative IDs array",
      message: "Please provide at least one creative ID"
    })
  }

  // Convert all creative IDs to numbers
  const numericCreativeIds = creativeIds.map(id => {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) {
      return null
    }
    return numericId
  }).filter(id => id !== null)

  if (numericCreativeIds.length === 0) {
    return res.status(400).json({
      error: "Invalid creative IDs",
      message: "All creative IDs must be valid numbers"
    })
  }

  const data = JSON.parse(fs.readFileSync(__dirname + '/data/marketing-data.json', 'utf8'))
  const creativePerformanceData = []
  
  // Search through all campaigns and their creatives
  data.campaigns.forEach(campaign => {
    if (campaign.creatives) {
      campaign.creatives.forEach(creative => {
        if (numericCreativeIds.includes(creative.id)) {
          creativePerformanceData.push({
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            campaign_status: campaign.status,
            campaign_medium: campaign.medium,
            creative_id: creative.id,
            creative_name: creative.name,
            creative_format: creative.format,
            creative_url: creative.url,
            performance_score: creative.performance_score,
            is_primary: creative.is_primary,
            impressions: creative.impressions,
            clicks: creative.clicks,
            ctr: creative.ctr,
            a_b_test_variant: creative.a_b_test_variant || null
          })
        }
      })
    }
  })
  
  if (creativePerformanceData.length === 0) {
    return res.status(404).json({
      error: "No creatives found",
      message: `No creatives found for the provided IDs: ${creativeIds.join(', ')}`
    })
  }
  
  res.json({
    message: "Creative performance data retrieved successfully",
    requested_ids: creativeIds,
    found_creatives: creativePerformanceData.length,
    data: creativePerformanceData
  })
})





// ============================================================






// Protected route using non-encrypted credentials
// Example: GET http://localhost:3000/simple-protected-data?username=ahmed_hassan&password=ahmedadmin123
app.get('/simple-protected-data', (req, res) => {
  try {
    // Extract query parameters
    const { username, password } = req.query

    // Check if credentials are provided
    if (!username || !password) {
      return res.status(400).json({
        error: "Missing credentials",
        message: "Username and password query parameters are required",
        example: "/simple-protected-data?username=ahmed_hassan&password=ahmedadmin123"
      })
    }

    // Load non-encrypted users data
    const usersPath = path.join(__dirname, 'data', 'users.json')
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'))
    
    // Find user by username
    const user = usersData.users.find(u => u.username === username)
    
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User not found"
      })
    }

    // Direct password comparison (no decryption needed)
    if (user.password !== password) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "User not found"
      })
    }

    // Check user role and respond accordingly
    if (user.role === 'admin') {
      // Admin users get access to the marketing data
      const marketingDataPath = path.join(__dirname, 'data', 'marketing-data.json')
      const marketingData = JSON.parse(fs.readFileSync(marketingDataPath, 'utf8'))
      
      res.json({
        message: "Access granted - Admin user authenticated",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        data: marketingData
      })
    } else if (user.role === 'user') {
      // Regular users get rejection message
      res.status(403).json({
        error: "Access denied",
        message: "User must be an admin to access this data.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      })
    } else {
      // Any other role (shouldn't happen with current data)
      res.status(403).json({
        error: "Access denied",
        message: "User not found"
      })
    }

  } catch (error) {
    console.error('Error in simple-protected-data route:', error)
    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred while processing your request"
    })
  }
})

// DATA ACCESS VIA USER CREDENTIALS
// ------------------------------------------------------------
// Protected route that requires encrypted credentials
// 
// TEST CASES:
// 1. Admin Access (Success): 
//    GET /protected-data?username=ahmed_hassan&password=hotlkhktpu123
//    Expected: 200 OK with full marketing data
//
// 2. Regular User (Blocked):
//    GET /protected-data?username=omar_mahmoud&password=vthy789whzz  
//    Expected: 403 Forbidden with "They must be an admin" message
//
// 3. Invalid User (Not Found):
//    GET /protected-data?username=invalid_user&password=wrongpass123
//    Expected: 404 Not Found with "User not found" message
//
app.get('/encrypted-protected-data', (req, res) => {
  try {
    // Extract query parameters
    const { username, password } = req.query

    // Check if credentials are provided
    if (!username || !password) {
      return res.status(400).json({
        error: "Missing credentials",
        message: "Username and password query parameters are required",
        example: "/protected-data?username=ahmed_hassan&password=hotlkhktpu123"
      })
    }

    // Load encrypted users data
    const encryptedUsersPath = path.join(__dirname, 'data', 'encrypted-users.json')
    const encryptedUsersData = JSON.parse(fs.readFileSync(encryptedUsersPath, 'utf8'))
    
    // Find user by username
    const user = encryptedUsersData.users.find(u => u.username === username)
    
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User not found"
      })
    }

    // Decrypt the stored password and compare with provided password
    const decryptedStoredPassword = simpleDecrypt(user.password)
    const decryptedProvidedPassword = simpleDecrypt(password)

    if (decryptedStoredPassword !== decryptedProvidedPassword) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "User not found"
      })
    }

    // Check user role and respond accordingly
    if (user.role === 'admin') {
      // Admin users get access to the marketing data
      const marketingDataPath = path.join(__dirname, 'data', 'marketing-data.json')
      const marketingData = JSON.parse(fs.readFileSync(marketingDataPath, 'utf8'))
      
      res.json({
        message: "Access granted - Admin user authenticated",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        data: marketingData
      })
    } else if (user.role === 'user') {
      // Regular users get rejection message
      res.status(403).json({
        error: "Access denied",
        message: "User must be an admin to access this data.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      })
    } else {
      // Any other role (shouldn't happen with current data)
      res.status(403).json({
        error: "Access denied",
        message: "User not found"
      })
    }

  } catch (error) {
    console.error('Error in protected-data route:', error)
    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred while processing your request"
    })
  }
})





// ============================================================






app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
