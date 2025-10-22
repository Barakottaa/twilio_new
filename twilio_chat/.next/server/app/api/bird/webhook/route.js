/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/bird/webhook/route";
exports.ids = ["app/api/bird/webhook/route"];
exports.modules = {

/***/ "(rsc)/./app/api/bird/webhook/route.ts":
/*!***************************************!*\
  !*** ./app/api/bird/webhook/route.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DELETE: () => (/* binding */ DELETE),\n/* harmony export */   GET: () => (/* binding */ GET),\n/* harmony export */   POST: () => (/* binding */ POST),\n/* harmony export */   PUT: () => (/* binding */ PUT),\n/* harmony export */   dynamic: () => (/* binding */ dynamic)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_bird_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/bird-service */ \"(rsc)/./lib/bird-service.ts\");\n\n\nconst dynamic = 'force-dynamic';\n// 🟢 Bird Webhook endpoint\nasync function POST(req) {\n    try {\n        const body = await req.json();\n        console.log('📩 Incoming Bird event:', JSON.stringify(body, null, 2));\n        // Handle Bird's actual payload format\n        const event = body.event;\n        const payload = body.payload;\n        // Extract contact info from the actual Bird format\n        let contact = null;\n        let postbackPayload = null;\n        if (event === 'whatsapp.inbound' && payload) {\n            // Get contact from sender\n            contact = payload.sender?.contact?.identifierValue;\n            // Check if there are actions with postback in the body.text.actions\n            if (payload.body?.text?.actions && payload.body.text.actions.length > 0) {\n                const postbackAction = payload.body.text.actions.find((action)=>action.type === 'postback');\n                if (postbackAction) {\n                    postbackPayload = postbackAction.postback?.payload;\n                }\n            }\n        }\n        console.log('🔍 Extracted data:', {\n            event,\n            contact,\n            postbackPayload\n        });\n        // Only handle button clicks (postbacks)\n        if (event === 'whatsapp.inbound' && contact && postbackPayload) {\n            let replyText = '';\n            if (postbackPayload === 'PAY_INSTAPAY') {\n                replyText = 'ده رقم انستاباي 01005648997 حول عليه وابعت صورة التحويل علي رقم 01120035300';\n            } else if (postbackPayload === 'PAY_VCASH') {\n                replyText = 'ده رقم فودافون كاش 01120035300 حول عليه وابعت صورة التحويل عشان نسجل التحويل';\n            }\n            if (replyText) {\n                try {\n                    const result = await (0,_lib_bird_service__WEBPACK_IMPORTED_MODULE_1__.sendBirdMessage)(contact, replyText);\n                    if (result.success) {\n                        console.log('✅ Reply sent successfully to', contact);\n                    } else {\n                        console.log('⚠️ Reply failed:', result.error);\n                        console.log('📝 Would have sent to', contact, ':', replyText);\n                    }\n                } catch (error) {\n                    console.log('⚠️ Bird message send failed:', error);\n                    console.log('📝 Would have sent to', contact, ':', replyText);\n                }\n            } else {\n                console.log('ℹ️ No reply configured for payload:', postbackPayload);\n            }\n        } else {\n            console.log('ℹ️ Event not handled:', {\n                event,\n                hasContact: !!contact,\n                hasPostback: !!postbackPayload\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            success: true\n        });\n    } catch (err) {\n        console.error('❌ Bird webhook error:', err.message);\n        console.error('❌ Error stack:', err.stack);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Internal Server Error'\n        }, {\n            status: 500\n        });\n    }\n}\n// Handle other HTTP methods\nasync function GET() {\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: 'Method Not Allowed'\n    }, {\n        status: 405\n    });\n}\nasync function PUT() {\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: 'Method Not Allowed'\n    }, {\n        status: 405\n    });\n}\nasync function DELETE() {\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: 'Method Not Allowed'\n    }, {\n        status: 405\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RTtJQUNwQixPQUFPcEMscURBQVlBLENBQUNNLElBQUksQ0FBQztRQUFFc0IsT0FBTztJQUFxQixHQUFHO1FBQUVNLFFBQVE7SUFBSTtBQUMxRTtBQUVPLGVBQWVHO0lBQ3BCLE9BQU9yQyxxREFBWUEsQ0FBQ00sSUFBSSxDQUFDO1FBQUVzQixPQUFPO0lBQXFCLEdBQUc7UUFBRU0sUUFBUTtJQUFJO0FBQzFFIiwic291cmNlcyI6WyJEOlxcTmV3IGZvbGRlclxcdHdpbGlvX25ld1xcdHdpbGlvX2NoYXRcXGFwcFxcYXBpXFxiaXJkXFx3ZWJob29rXFxyb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInO1xyXG5pbXBvcnQgeyBzZW5kQmlyZE1lc3NhZ2UgfSBmcm9tICdAL2xpYi9iaXJkLXNlcnZpY2UnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGR5bmFtaWMgPSAnZm9yY2UtZHluYW1pYyc7XHJcblxyXG4vLyDwn5+iIEJpcmQgV2ViaG9vayBlbmRwb2ludFxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXE6IE5leHRSZXF1ZXN0KSB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXEuanNvbigpO1xyXG4gICAgY29uc29sZS5sb2coJ/Cfk6kgSW5jb21pbmcgQmlyZCBldmVudDonLCBKU09OLnN0cmluZ2lmeShib2R5LCBudWxsLCAyKSk7XHJcblxyXG4gICAgLy8gSGFuZGxlIEJpcmQncyBhY3R1YWwgcGF5bG9hZCBmb3JtYXRcclxuICAgIGNvbnN0IGV2ZW50ID0gYm9keS5ldmVudDtcclxuICAgIGNvbnN0IHBheWxvYWQgPSBib2R5LnBheWxvYWQ7XHJcbiAgICBcclxuICAgIC8vIEV4dHJhY3QgY29udGFjdCBpbmZvIGZyb20gdGhlIGFjdHVhbCBCaXJkIGZvcm1hdFxyXG4gICAgbGV0IGNvbnRhY3QgPSBudWxsO1xyXG4gICAgbGV0IHBvc3RiYWNrUGF5bG9hZCA9IG51bGw7XHJcbiAgICBcclxuICAgIGlmIChldmVudCA9PT0gJ3doYXRzYXBwLmluYm91bmQnICYmIHBheWxvYWQpIHtcclxuICAgICAgLy8gR2V0IGNvbnRhY3QgZnJvbSBzZW5kZXJcclxuICAgICAgY29udGFjdCA9IHBheWxvYWQuc2VuZGVyPy5jb250YWN0Py5pZGVudGlmaWVyVmFsdWU7XHJcbiAgICAgIFxyXG4gICAgICAvLyBDaGVjayBpZiB0aGVyZSBhcmUgYWN0aW9ucyB3aXRoIHBvc3RiYWNrIGluIHRoZSBib2R5LnRleHQuYWN0aW9uc1xyXG4gICAgICBpZiAocGF5bG9hZC5ib2R5Py50ZXh0Py5hY3Rpb25zICYmIHBheWxvYWQuYm9keS50ZXh0LmFjdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNvbnN0IHBvc3RiYWNrQWN0aW9uID0gcGF5bG9hZC5ib2R5LnRleHQuYWN0aW9ucy5maW5kKGFjdGlvbiA9PiBhY3Rpb24udHlwZSA9PT0gJ3Bvc3RiYWNrJyk7XHJcbiAgICAgICAgaWYgKHBvc3RiYWNrQWN0aW9uKSB7XHJcbiAgICAgICAgICBwb3N0YmFja1BheWxvYWQgPSBwb3N0YmFja0FjdGlvbi5wb3N0YmFjaz8ucGF5bG9hZDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zb2xlLmxvZygn8J+UjSBFeHRyYWN0ZWQgZGF0YTonLCB7IGV2ZW50LCBjb250YWN0LCBwb3N0YmFja1BheWxvYWQgfSk7XHJcblxyXG4gICAgLy8gT25seSBoYW5kbGUgYnV0dG9uIGNsaWNrcyAocG9zdGJhY2tzKVxyXG4gICAgaWYgKGV2ZW50ID09PSAnd2hhdHNhcHAuaW5ib3VuZCcgJiYgY29udGFjdCAmJiBwb3N0YmFja1BheWxvYWQpIHtcclxuICAgICAgbGV0IHJlcGx5VGV4dCA9ICcnO1xyXG5cclxuICAgICAgaWYgKHBvc3RiYWNrUGF5bG9hZCA9PT0gJ1BBWV9JTlNUQVBBWScpIHtcclxuICAgICAgICByZXBseVRleHQgPSAn2K/ZhyDYsdmC2YUg2KfZhtiz2KrYp9io2KfZiiAwMTAwNTY0ODk5NyDYrdmI2YQg2LnZhNmK2Ycg2YjYp9io2LnYqiDYtdmI2LHYqSDYp9mE2KrYrdmI2YrZhCDYudmE2Yog2LHZgtmFIDAxMTIwMDM1MzAwJztcclxuICAgICAgfSBlbHNlIGlmIChwb3N0YmFja1BheWxvYWQgPT09ICdQQVlfVkNBU0gnKSB7XHJcbiAgICAgICAgcmVwbHlUZXh0ID0gJ9iv2Ycg2LHZgtmFINmB2YjYr9in2YHZiNmGINmD2KfYtCAwMTEyMDAzNTMwMCDYrdmI2YQg2LnZhNmK2Ycg2YjYp9io2LnYqiDYtdmI2LHYqSDYp9mE2KrYrdmI2YrZhCDYudi02KfZhiDZhtiz2KzZhCDYp9mE2KrYrdmI2YrZhCc7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChyZXBseVRleHQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VuZEJpcmRNZXNzYWdlKGNvbnRhY3QsIHJlcGx5VGV4dCk7XHJcbiAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ+KchSBSZXBseSBzZW50IHN1Y2Nlc3NmdWxseSB0bycsIGNvbnRhY3QpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ+KaoO+4jyBSZXBseSBmYWlsZWQ6JywgcmVzdWx0LmVycm9yKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ/Cfk50gV291bGQgaGF2ZSBzZW50IHRvJywgY29udGFjdCwgJzonLCByZXBseVRleHQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygn4pqg77iPIEJpcmQgbWVzc2FnZSBzZW5kIGZhaWxlZDonLCBlcnJvcik7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygn8J+TnSBXb3VsZCBoYXZlIHNlbnQgdG8nLCBjb250YWN0LCAnOicsIHJlcGx5VGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCfihLnvuI8gTm8gcmVwbHkgY29uZmlndXJlZCBmb3IgcGF5bG9hZDonLCBwb3N0YmFja1BheWxvYWQpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmxvZygn4oS577iPIEV2ZW50IG5vdCBoYW5kbGVkOicsIHsgZXZlbnQsIGhhc0NvbnRhY3Q6ICEhY29udGFjdCwgaGFzUG9zdGJhY2s6ICEhcG9zdGJhY2tQYXlsb2FkIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IHN1Y2Nlc3M6IHRydWUgfSk7XHJcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBCaXJkIHdlYmhvb2sgZXJyb3I6JywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgY29uc29sZS5lcnJvcign4p2MIEVycm9yIHN0YWNrOicsIGVyci5zdGFjayk7XHJcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oXHJcbiAgICAgIHsgZXJyb3I6ICdJbnRlcm5hbCBTZXJ2ZXIgRXJyb3InIH0sXHJcbiAgICAgIHsgc3RhdHVzOiA1MDAgfVxyXG4gICAgKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIEhhbmRsZSBvdGhlciBIVFRQIG1ldGhvZHNcclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVCgpIHtcclxuICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ01ldGhvZCBOb3QgQWxsb3dlZCcgfSwgeyBzdGF0dXM6IDQwNSB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBVVCgpIHtcclxuICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ01ldGhvZCBOb3QgQWxsb3dlZCcgfSwgeyBzdGF0dXM6IDQwNSB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIERFTEVURSgpIHtcclxuICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ01ldGhvZCBOb3QgQWxsb3dlZCcgfSwgeyBzdGF0dXM6IDQwNSB9KTtcclxufVxyXG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwic2VuZEJpcmRNZXNzYWdlIiwiZHluYW1pYyIsIlBPU1QiLCJyZXEiLCJib2R5IiwianNvbiIsImNvbnNvbGUiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5IiwiZXZlbnQiLCJwYXlsb2FkIiwiY29udGFjdCIsInBvc3RiYWNrUGF5bG9hZCIsInNlbmRlciIsImlkZW50aWZpZXJWYWx1ZSIsInRleHQiLCJhY3Rpb25zIiwibGVuZ3RoIiwicG9zdGJhY2tBY3Rpb24iLCJmaW5kIiwiYWN0aW9uIiwidHlwZSIsInBvc3RiYWNrIiwicmVwbHlUZXh0IiwicmVzdWx0Iiwic3VjY2VzcyIsImVycm9yIiwiaGFzQ29udGFjdCIsImhhc1Bvc3RiYWNrIiwiZXJyIiwibWVzc2FnZSIsInN0YWNrIiwic3RhdHVzIiwiR0VUIiwiUFVUIiwiREVMRVRFIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/bird/webhook/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/bird-service.ts":
/*!*****************************!*\
  !*** ./lib/bird-service.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   sendBirdMessage: () => (/* binding */ sendBirdMessage),\n/* harmony export */   sendBirdTemplateMessage: () => (/* binding */ sendBirdTemplateMessage),\n/* harmony export */   testBirdConnection: () => (/* binding */ testBirdConnection),\n/* harmony export */   validateBirdConfig: () => (/* binding */ validateBirdConfig)\n/* harmony export */ });\n/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! axios */ \"(rsc)/./node_modules/axios/lib/axios.js\");\n\n// 🕊️ Bird API service for sending WhatsApp messages\nasync function sendBirdMessage(to, text) {\n    const apiKey = process.env.BIRD_API_KEY;\n    if (!apiKey) {\n        throw new Error('BIRD_API_KEY is not configured in environment variables');\n    }\n    try {\n        console.log('🕊️ Sending Bird message:', {\n            to,\n            text: text.substring(0, 50) + '...'\n        });\n        // Try the template API approach first (using workspace/channel structure)\n        const workspaceId = '2d7a1e03-25e4-401e-bf1e-0ace545673d7';\n        const channelId = '8e046034-bca7-5124-89d0-1a64c1cbe819';\n        const payload = {\n            receiver: {\n                contacts: [\n                    {\n                        identifierValue: to,\n                        identifierKey: \"phonenumber\"\n                    }\n                ]\n            },\n            body: {\n                type: \"text\",\n                text: {\n                    text: text\n                }\n            }\n        };\n        const response = await axios__WEBPACK_IMPORTED_MODULE_0__[\"default\"].post(`https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`, payload, {\n            headers: {\n                Authorization: `AccessKey ${apiKey}`,\n                'Content-Type': 'application/json'\n            },\n            timeout: 10000\n        });\n        console.log('✅ Bird reply sent successfully:', {\n            messageId: response.data.id,\n            status: response.data.status,\n            to: to\n        });\n        return {\n            success: true,\n            messageId: response.data.id,\n            status: response.data.status,\n            data: response.data\n        };\n    } catch (error) {\n        console.error('❌ Bird send failed:', {\n            error: error.message,\n            response: error.response?.data,\n            status: error.response?.status\n        });\n        // Log the error but don't throw - let the webhook continue\n        console.log('⚠️ Bird message send failed, but webhook will continue');\n        return {\n            success: false,\n            error: error.response?.data?.message || error.message\n        };\n    }\n}\n// 🕊️ Helper to validate Bird configuration\nfunction validateBirdConfig() {\n    const apiKey = process.env.BIRD_API_KEY;\n    const whatsappNumber = process.env.BIRD_WHATSAPP_NUMBER;\n    if (!apiKey) {\n        throw new Error('BIRD_API_KEY is required in environment variables');\n    }\n    if (!whatsappNumber) {\n        console.warn('⚠️ BIRD_WHATSAPP_NUMBER not set, using default: +201100414204');\n    }\n    return {\n        apiKey: !!apiKey,\n        whatsappNumber: whatsappNumber || '+201100414204'\n    };\n}\n// 🕊️ Send template-based message via Bird API\nasync function sendBirdTemplateMessage(workspaceId, channelId, projectId, templateVersion, phoneNumber, parameters, locale = 'en') {\n    const apiKey = process.env.BIRD_API_KEY;\n    if (!apiKey) {\n        throw new Error('BIRD_API_KEY is not configured in environment variables');\n    }\n    try {\n        console.log('🕊️ Sending Bird template message:', {\n            workspaceId,\n            channelId,\n            projectId,\n            phoneNumber,\n            parametersCount: parameters.length\n        });\n        const payload = {\n            receiver: {\n                contacts: [\n                    {\n                        identifierValue: phoneNumber,\n                        identifierKey: \"phonenumber\"\n                    }\n                ]\n            },\n            template: {\n                projectId,\n                version: templateVersion,\n                locale,\n                parameters\n            }\n        };\n        const response = await axios__WEBPACK_IMPORTED_MODULE_0__[\"default\"].post(`https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`, payload, {\n            headers: {\n                Authorization: `AccessKey ${apiKey}`,\n                'Content-Type': 'application/json'\n            },\n            timeout: 30000\n        });\n        console.log('✅ Bird template message sent successfully:', {\n            messageId: response.data.id,\n            status: response.data.status,\n            to: phoneNumber\n        });\n        return {\n            success: true,\n            messageId: response.data.id,\n            status: response.data.status,\n            data: response.data\n        };\n    } catch (error) {\n        console.error('❌ Bird template send failed:', {\n            error: error.message,\n            response: error.response?.data,\n            status: error.response?.status\n        });\n        throw new Error(`Failed to send Bird template message: ${error.response?.data?.message || error.message}`);\n    }\n}\n// 🕊️ Test Bird API connection\nasync function testBirdConnection() {\n    try {\n        const config = validateBirdConfig();\n        console.log('🕊️ Bird configuration validated:', {\n            hasApiKey: config.apiKey,\n            whatsappNumber: config.whatsappNumber\n        });\n        // You could add a test API call here if Bird provides a test endpoint\n        return {\n            success: true,\n            message: 'Bird configuration is valid',\n            config\n        };\n    } catch (error) {\n        console.error('❌ Bird configuration test failed:', error.message);\n        return {\n            success: false,\n            error: error.message\n        };\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvYmlyZC1zZXJ2aWNlLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQTBCO0FBRTFCLHFEQUFxRDtBQUM5QyxlQUFlQyxnQkFBZ0JDLEVBQVUsRUFBRUMsSUFBWTtJQUM1RCxNQUFNQyxTQUFTQyxRQUFRQyxHQUFHLENBQUNDLFlBQVk7SUFFdkMsSUFBSSxDQUFDSCxRQUFRO1FBQ1gsTUFBTSxJQUFJSSxNQUFNO0lBQ2xCO0lBRUEsSUFBSTtRQUNGQyxRQUFRQyxHQUFHLENBQUMsNkJBQTZCO1lBQUVSO1lBQUlDLE1BQU1BLEtBQUtRLFNBQVMsQ0FBQyxHQUFHLE1BQU07UUFBTTtRQUVuRiwwRUFBMEU7UUFDMUUsTUFBTUMsY0FBYztRQUNwQixNQUFNQyxZQUFZO1FBRWxCLE1BQU1DLFVBQVU7WUFDZEMsVUFBVTtnQkFDUkMsVUFBVTtvQkFDUjt3QkFDRUMsaUJBQWlCZjt3QkFDakJnQixlQUFlO29CQUNqQjtpQkFDRDtZQUNIO1lBQ0FDLE1BQU07Z0JBQ0pDLE1BQU07Z0JBQ05qQixNQUFNO29CQUNKQSxNQUFNQTtnQkFDUjtZQUNGO1FBQ0Y7UUFFQSxNQUFNa0IsV0FBVyxNQUFNckIsNkNBQUtBLENBQUNzQixJQUFJLENBQy9CLENBQUMsZ0NBQWdDLEVBQUVWLFlBQVksVUFBVSxFQUFFQyxVQUFVLFNBQVMsQ0FBQyxFQUMvRUMsU0FDQTtZQUNFUyxTQUFTO2dCQUNQQyxlQUFlLENBQUMsVUFBVSxFQUFFcEIsUUFBUTtnQkFDcEMsZ0JBQWdCO1lBQ2xCO1lBQ0FxQixTQUFTO1FBQ1g7UUFHRmhCLFFBQVFDLEdBQUcsQ0FBQyxtQ0FBbUM7WUFDN0NnQixXQUFXTCxTQUFTTSxJQUFJLENBQUNDLEVBQUU7WUFDM0JDLFFBQVFSLFNBQVNNLElBQUksQ0FBQ0UsTUFBTTtZQUM1QjNCLElBQUlBO1FBQ047UUFFQSxPQUFPO1lBQ0w0QixTQUFTO1lBQ1RKLFdBQVdMLFNBQVNNLElBQUksQ0FBQ0MsRUFBRTtZQUMzQkMsUUFBUVIsU0FBU00sSUFBSSxDQUFDRSxNQUFNO1lBQzVCRixNQUFNTixTQUFTTSxJQUFJO1FBQ3JCO0lBQ0YsRUFBRSxPQUFPSSxPQUFZO1FBQ25CdEIsUUFBUXNCLEtBQUssQ0FBQyx1QkFBdUI7WUFDbkNBLE9BQU9BLE1BQU1DLE9BQU87WUFDcEJYLFVBQVVVLE1BQU1WLFFBQVEsRUFBRU07WUFDMUJFLFFBQVFFLE1BQU1WLFFBQVEsRUFBRVE7UUFDMUI7UUFFQSwyREFBMkQ7UUFDM0RwQixRQUFRQyxHQUFHLENBQUM7UUFDWixPQUFPO1lBQ0xvQixTQUFTO1lBQ1RDLE9BQU9BLE1BQU1WLFFBQVEsRUFBRU0sTUFBTUssV0FBV0QsTUFBTUMsT0FBTztRQUN2RDtJQUNGO0FBQ0Y7QUFFQSw0Q0FBNEM7QUFDckMsU0FBU0M7SUFDZCxNQUFNN0IsU0FBU0MsUUFBUUMsR0FBRyxDQUFDQyxZQUFZO0lBQ3ZDLE1BQU0yQixpQkFBaUI3QixRQUFRQyxHQUFHLENBQUM2QixvQkFBb0I7SUFFdkQsSUFBSSxDQUFDL0IsUUFBUTtRQUNYLE1BQU0sSUFBSUksTUFBTTtJQUNsQjtJQUVBLElBQUksQ0FBQzBCLGdCQUFnQjtRQUNuQnpCLFFBQVEyQixJQUFJLENBQUM7SUFDZjtJQUVBLE9BQU87UUFDTGhDLFFBQVEsQ0FBQyxDQUFDQTtRQUNWOEIsZ0JBQWdCQSxrQkFBa0I7SUFDcEM7QUFDRjtBQUVBLCtDQUErQztBQUN4QyxlQUFlRyx3QkFDcEJ6QixXQUFtQixFQUNuQkMsU0FBaUIsRUFDakJ5QixTQUFpQixFQUNqQkMsZUFBdUIsRUFDdkJDLFdBQW1CLEVBQ25CQyxVQUErRCxFQUMvREMsU0FBaUIsSUFBSTtJQUVyQixNQUFNdEMsU0FBU0MsUUFBUUMsR0FBRyxDQUFDQyxZQUFZO0lBRXZDLElBQUksQ0FBQ0gsUUFBUTtRQUNYLE1BQU0sSUFBSUksTUFBTTtJQUNsQjtJQUVBLElBQUk7UUFDRkMsUUFBUUMsR0FBRyxDQUFDLHNDQUFzQztZQUNoREU7WUFDQUM7WUFDQXlCO1lBQ0FFO1lBQ0FHLGlCQUFpQkYsV0FBV0csTUFBTTtRQUNwQztRQUVBLE1BQU05QixVQUFVO1lBQ2RDLFVBQVU7Z0JBQ1JDLFVBQVU7b0JBQ1I7d0JBQ0VDLGlCQUFpQnVCO3dCQUNqQnRCLGVBQWU7b0JBQ2pCO2lCQUNEO1lBQ0g7WUFDQTJCLFVBQVU7Z0JBQ1JQO2dCQUNBUSxTQUFTUDtnQkFDVEc7Z0JBQ0FEO1lBQ0Y7UUFDRjtRQUVBLE1BQU1wQixXQUFXLE1BQU1yQiw2Q0FBS0EsQ0FBQ3NCLElBQUksQ0FDL0IsQ0FBQyxnQ0FBZ0MsRUFBRVYsWUFBWSxVQUFVLEVBQUVDLFVBQVUsU0FBUyxDQUFDLEVBQy9FQyxTQUNBO1lBQ0VTLFNBQVM7Z0JBQ1BDLGVBQWUsQ0FBQyxVQUFVLEVBQUVwQixRQUFRO2dCQUNwQyxnQkFBZ0I7WUFDbEI7WUFDQXFCLFNBQVM7UUFDWDtRQUdGaEIsUUFBUUMsR0FBRyxDQUFDLDhDQUE4QztZQUN4RGdCLFdBQVdMLFNBQVNNLElBQUksQ0FBQ0MsRUFBRTtZQUMzQkMsUUFBUVIsU0FBU00sSUFBSSxDQUFDRSxNQUFNO1lBQzVCM0IsSUFBSXNDO1FBQ047UUFFQSxPQUFPO1lBQ0xWLFNBQVM7WUFDVEosV0FBV0wsU0FBU00sSUFBSSxDQUFDQyxFQUFFO1lBQzNCQyxRQUFRUixTQUFTTSxJQUFJLENBQUNFLE1BQU07WUFDNUJGLE1BQU1OLFNBQVNNLElBQUk7UUFDckI7SUFDRixFQUFFLE9BQU9JLE9BQVk7UUFDbkJ0QixRQUFRc0IsS0FBSyxDQUFDLGdDQUFnQztZQUM1Q0EsT0FBT0EsTUFBTUMsT0FBTztZQUNwQlgsVUFBVVUsTUFBTVYsUUFBUSxFQUFFTTtZQUMxQkUsUUFBUUUsTUFBTVYsUUFBUSxFQUFFUTtRQUMxQjtRQUVBLE1BQU0sSUFBSXJCLE1BQU0sQ0FBQyxzQ0FBc0MsRUFBRXVCLE1BQU1WLFFBQVEsRUFBRU0sTUFBTUssV0FBV0QsTUFBTUMsT0FBTyxFQUFFO0lBQzNHO0FBQ0Y7QUFFQSwrQkFBK0I7QUFDeEIsZUFBZWU7SUFDcEIsSUFBSTtRQUNGLE1BQU1DLFNBQVNmO1FBQ2Z4QixRQUFRQyxHQUFHLENBQUMscUNBQXFDO1lBQy9DdUMsV0FBV0QsT0FBTzVDLE1BQU07WUFDeEI4QixnQkFBZ0JjLE9BQU9kLGNBQWM7UUFDdkM7UUFFQSxzRUFBc0U7UUFDdEUsT0FBTztZQUNMSixTQUFTO1lBQ1RFLFNBQVM7WUFDVGdCO1FBQ0Y7SUFDRixFQUFFLE9BQU9qQixPQUFZO1FBQ25CdEIsUUFBUXNCLEtBQUssQ0FBQyxxQ0FBcUNBLE1BQU1DLE9BQU87UUFDaEUsT0FBTztZQUNMRixTQUFTO1lBQ1RDLE9BQU9BLE1BQU1DLE9BQU87UUFDdEI7SUFDRjtBQUNGIiwic291cmNlcyI6WyJEOlxcTmV3IGZvbGRlclxcdHdpbGlvX25ld1xcdHdpbGlvX2NoYXRcXGxpYlxcYmlyZC1zZXJ2aWNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBheGlvcyBmcm9tICdheGlvcyc7XHJcblxyXG4vLyDwn5WK77iPIEJpcmQgQVBJIHNlcnZpY2UgZm9yIHNlbmRpbmcgV2hhdHNBcHAgbWVzc2FnZXNcclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRCaXJkTWVzc2FnZSh0bzogc3RyaW5nLCB0ZXh0OiBzdHJpbmcpIHtcclxuICBjb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5CSVJEX0FQSV9LRVk7XHJcblxyXG4gIGlmICghYXBpS2V5KSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0JJUkRfQVBJX0tFWSBpcyBub3QgY29uZmlndXJlZCBpbiBlbnZpcm9ubWVudCB2YXJpYWJsZXMnKTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zb2xlLmxvZygn8J+Viu+4jyBTZW5kaW5nIEJpcmQgbWVzc2FnZTonLCB7IHRvLCB0ZXh0OiB0ZXh0LnN1YnN0cmluZygwLCA1MCkgKyAnLi4uJyB9KTtcclxuXHJcbiAgICAvLyBUcnkgdGhlIHRlbXBsYXRlIEFQSSBhcHByb2FjaCBmaXJzdCAodXNpbmcgd29ya3NwYWNlL2NoYW5uZWwgc3RydWN0dXJlKVxyXG4gICAgY29uc3Qgd29ya3NwYWNlSWQgPSAnMmQ3YTFlMDMtMjVlNC00MDFlLWJmMWUtMGFjZTU0NTY3M2Q3JztcclxuICAgIGNvbnN0IGNoYW5uZWxJZCA9ICc4ZTA0NjAzNC1iY2E3LTUxMjQtODlkMC0xYTY0YzFjYmU4MTknO1xyXG5cclxuICAgIGNvbnN0IHBheWxvYWQgPSB7XHJcbiAgICAgIHJlY2VpdmVyOiB7XHJcbiAgICAgICAgY29udGFjdHM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgaWRlbnRpZmllclZhbHVlOiB0byxcclxuICAgICAgICAgICAgaWRlbnRpZmllcktleTogXCJwaG9uZW51bWJlclwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiB7XHJcbiAgICAgICAgdHlwZTogXCJ0ZXh0XCIsXHJcbiAgICAgICAgdGV4dDoge1xyXG4gICAgICAgICAgdGV4dDogdGV4dFxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLnBvc3QoXHJcbiAgICAgIGBodHRwczovL2FwaS5iaXJkLmNvbS93b3Jrc3BhY2VzLyR7d29ya3NwYWNlSWR9L2NoYW5uZWxzLyR7Y2hhbm5lbElkfS9tZXNzYWdlc2AsXHJcbiAgICAgIHBheWxvYWQsXHJcbiAgICAgIHtcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiBgQWNjZXNzS2V5ICR7YXBpS2V5fWAsXHJcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGltZW91dDogMTAwMDAsIC8vIDEwIHNlY29uZCB0aW1lb3V0XHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgY29uc29sZS5sb2coJ+KchSBCaXJkIHJlcGx5IHNlbnQgc3VjY2Vzc2Z1bGx5OicsIHtcclxuICAgICAgbWVzc2FnZUlkOiByZXNwb25zZS5kYXRhLmlkLFxyXG4gICAgICBzdGF0dXM6IHJlc3BvbnNlLmRhdGEuc3RhdHVzLFxyXG4gICAgICB0bzogdG9cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2VJZDogcmVzcG9uc2UuZGF0YS5pZCxcclxuICAgICAgc3RhdHVzOiByZXNwb25zZS5kYXRhLnN0YXR1cyxcclxuICAgICAgZGF0YTogcmVzcG9uc2UuZGF0YVxyXG4gICAgfTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCfinYwgQmlyZCBzZW5kIGZhaWxlZDonLCB7XHJcbiAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxyXG4gICAgICByZXNwb25zZTogZXJyb3IucmVzcG9uc2U/LmRhdGEsXHJcbiAgICAgIHN0YXR1czogZXJyb3IucmVzcG9uc2U/LnN0YXR1c1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTG9nIHRoZSBlcnJvciBidXQgZG9uJ3QgdGhyb3cgLSBsZXQgdGhlIHdlYmhvb2sgY29udGludWVcclxuICAgIGNvbnNvbGUubG9nKCfimqDvuI8gQmlyZCBtZXNzYWdlIHNlbmQgZmFpbGVkLCBidXQgd2ViaG9vayB3aWxsIGNvbnRpbnVlJyk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgZXJyb3I6IGVycm9yLnJlc3BvbnNlPy5kYXRhPy5tZXNzYWdlIHx8IGVycm9yLm1lc3NhZ2VcclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG4vLyDwn5WK77iPIEhlbHBlciB0byB2YWxpZGF0ZSBCaXJkIGNvbmZpZ3VyYXRpb25cclxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlQmlyZENvbmZpZygpIHtcclxuICBjb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5CSVJEX0FQSV9LRVk7XHJcbiAgY29uc3Qgd2hhdHNhcHBOdW1iZXIgPSBwcm9jZXNzLmVudi5CSVJEX1dIQVRTQVBQX05VTUJFUjtcclxuXHJcbiAgaWYgKCFhcGlLZXkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignQklSRF9BUElfS0VZIGlzIHJlcXVpcmVkIGluIGVudmlyb25tZW50IHZhcmlhYmxlcycpO1xyXG4gIH1cclxuXHJcbiAgaWYgKCF3aGF0c2FwcE51bWJlcikge1xyXG4gICAgY29uc29sZS53YXJuKCfimqDvuI8gQklSRF9XSEFUU0FQUF9OVU1CRVIgbm90IHNldCwgdXNpbmcgZGVmYXVsdDogKzIwMTEwMDQxNDIwNCcpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGFwaUtleTogISFhcGlLZXksXHJcbiAgICB3aGF0c2FwcE51bWJlcjogd2hhdHNhcHBOdW1iZXIgfHwgJysyMDExMDA0MTQyMDQnXHJcbiAgfTtcclxufVxyXG5cclxuLy8g8J+Viu+4jyBTZW5kIHRlbXBsYXRlLWJhc2VkIG1lc3NhZ2UgdmlhIEJpcmQgQVBJXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kQmlyZFRlbXBsYXRlTWVzc2FnZShcclxuICB3b3Jrc3BhY2VJZDogc3RyaW5nLFxyXG4gIGNoYW5uZWxJZDogc3RyaW5nLFxyXG4gIHByb2plY3RJZDogc3RyaW5nLFxyXG4gIHRlbXBsYXRlVmVyc2lvbjogc3RyaW5nLFxyXG4gIHBob25lTnVtYmVyOiBzdHJpbmcsXHJcbiAgcGFyYW1ldGVyczogQXJyYXk8eyB0eXBlOiBzdHJpbmc7IGtleTogc3RyaW5nOyB2YWx1ZTogc3RyaW5nIH0+LFxyXG4gIGxvY2FsZTogc3RyaW5nID0gJ2VuJ1xyXG4pIHtcclxuICBjb25zdCBhcGlLZXkgPSBwcm9jZXNzLmVudi5CSVJEX0FQSV9LRVk7XHJcblxyXG4gIGlmICghYXBpS2V5KSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0JJUkRfQVBJX0tFWSBpcyBub3QgY29uZmlndXJlZCBpbiBlbnZpcm9ubWVudCB2YXJpYWJsZXMnKTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zb2xlLmxvZygn8J+Viu+4jyBTZW5kaW5nIEJpcmQgdGVtcGxhdGUgbWVzc2FnZTonLCB7IFxyXG4gICAgICB3b3Jrc3BhY2VJZCwgXHJcbiAgICAgIGNoYW5uZWxJZCwgXHJcbiAgICAgIHByb2plY3RJZCwgXHJcbiAgICAgIHBob25lTnVtYmVyLFxyXG4gICAgICBwYXJhbWV0ZXJzQ291bnQ6IHBhcmFtZXRlcnMubGVuZ3RoIFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgcGF5bG9hZCA9IHtcclxuICAgICAgcmVjZWl2ZXI6IHtcclxuICAgICAgICBjb250YWN0czogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBpZGVudGlmaWVyVmFsdWU6IHBob25lTnVtYmVyLFxyXG4gICAgICAgICAgICBpZGVudGlmaWVyS2V5OiBcInBob25lbnVtYmVyXCJcclxuICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICAgIHRlbXBsYXRlOiB7XHJcbiAgICAgICAgcHJvamVjdElkLFxyXG4gICAgICAgIHZlcnNpb246IHRlbXBsYXRlVmVyc2lvbixcclxuICAgICAgICBsb2NhbGUsXHJcbiAgICAgICAgcGFyYW1ldGVyc1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdChcclxuICAgICAgYGh0dHBzOi8vYXBpLmJpcmQuY29tL3dvcmtzcGFjZXMvJHt3b3Jrc3BhY2VJZH0vY2hhbm5lbHMvJHtjaGFubmVsSWR9L21lc3NhZ2VzYCxcclxuICAgICAgcGF5bG9hZCxcclxuICAgICAge1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBBY2Nlc3NLZXkgJHthcGlLZXl9YCxcclxuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB0aW1lb3V0OiAzMDAwMCwgLy8gMzAgc2Vjb25kIHRpbWVvdXRcclxuICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZygn4pyFIEJpcmQgdGVtcGxhdGUgbWVzc2FnZSBzZW50IHN1Y2Nlc3NmdWxseTonLCB7XHJcbiAgICAgIG1lc3NhZ2VJZDogcmVzcG9uc2UuZGF0YS5pZCxcclxuICAgICAgc3RhdHVzOiByZXNwb25zZS5kYXRhLnN0YXR1cyxcclxuICAgICAgdG86IHBob25lTnVtYmVyXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBtZXNzYWdlSWQ6IHJlc3BvbnNlLmRhdGEuaWQsXHJcbiAgICAgIHN0YXR1czogcmVzcG9uc2UuZGF0YS5zdGF0dXMsXHJcbiAgICAgIGRhdGE6IHJlc3BvbnNlLmRhdGFcclxuICAgIH07XHJcbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgY29uc29sZS5lcnJvcign4p2MIEJpcmQgdGVtcGxhdGUgc2VuZCBmYWlsZWQ6Jywge1xyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcclxuICAgICAgcmVzcG9uc2U6IGVycm9yLnJlc3BvbnNlPy5kYXRhLFxyXG4gICAgICBzdGF0dXM6IGVycm9yLnJlc3BvbnNlPy5zdGF0dXNcclxuICAgIH0pO1xyXG5cclxuICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHNlbmQgQmlyZCB0ZW1wbGF0ZSBtZXNzYWdlOiAke2Vycm9yLnJlc3BvbnNlPy5kYXRhPy5tZXNzYWdlIHx8IGVycm9yLm1lc3NhZ2V9YCk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyDwn5WK77iPIFRlc3QgQmlyZCBBUEkgY29ubmVjdGlvblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdEJpcmRDb25uZWN0aW9uKCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjb25maWcgPSB2YWxpZGF0ZUJpcmRDb25maWcoKTtcclxuICAgIGNvbnNvbGUubG9nKCfwn5WK77iPIEJpcmQgY29uZmlndXJhdGlvbiB2YWxpZGF0ZWQ6Jywge1xyXG4gICAgICBoYXNBcGlLZXk6IGNvbmZpZy5hcGlLZXksXHJcbiAgICAgIHdoYXRzYXBwTnVtYmVyOiBjb25maWcud2hhdHNhcHBOdW1iZXJcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFlvdSBjb3VsZCBhZGQgYSB0ZXN0IEFQSSBjYWxsIGhlcmUgaWYgQmlyZCBwcm92aWRlcyBhIHRlc3QgZW5kcG9pbnRcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXHJcbiAgICAgIG1lc3NhZ2U6ICdCaXJkIGNvbmZpZ3VyYXRpb24gaXMgdmFsaWQnLFxyXG4gICAgICBjb25maWdcclxuICAgIH07XHJcbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgY29uc29sZS5lcnJvcign4p2MIEJpcmQgY29uZmlndXJhdGlvbiB0ZXN0IGZhaWxlZDonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZVxyXG4gICAgfTtcclxuICB9XHJcbn1cclxuIl0sIm5hbWVzIjpbImF4aW9zIiwic2VuZEJpcmRNZXNzYWdlIiwidG8iLCJ0ZXh0IiwiYXBpS2V5IiwicHJvY2VzcyIsImVudiIsIkJJUkRfQVBJX0tFWSIsIkVycm9yIiwiY29uc29sZSIsImxvZyIsInN1YnN0cmluZyIsIndvcmtzcGFjZUlkIiwiY2hhbm5lbElkIiwicGF5bG9hZCIsInJlY2VpdmVyIiwiY29udGFjdHMiLCJpZGVudGlmaWVyVmFsdWUiLCJpZGVudGlmaWVyS2V5IiwiYm9keSIsInR5cGUiLCJyZXNwb25zZSIsInBvc3QiLCJoZWFkZXJzIiwiQXV0aG9yaXphdGlvbiIsInRpbWVvdXQiLCJtZXNzYWdlSWQiLCJkYXRhIiwiaWQiLCJzdGF0dXMiLCJzdWNjZXNzIiwiZXJyb3IiLCJtZXNzYWdlIiwidmFsaWRhdGVCaXJkQ29uZmlnIiwid2hhdHNhcHBOdW1iZXIiLCJCSVJEX1dIQVRTQVBQX05VTUJFUiIsIndhcm4iLCJzZW5kQmlyZFRlbXBsYXRlTWVzc2FnZSIsInByb2plY3RJZCIsInRlbXBsYXRlVmVyc2lvbiIsInBob25lTnVtYmVyIiwicGFyYW1ldGVycyIsImxvY2FsZSIsInBhcmFtZXRlcnNDb3VudCIsImxlbmd0aCIsInRlbXBsYXRlIiwidmVyc2lvbiIsInRlc3RCaXJkQ29ubmVjdGlvbiIsImNvbmZpZyIsImhhc0FwaUtleSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/bird-service.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fbird%2Fwebhook%2Froute&page=%2Fapi%2Fbird%2Fwebhook%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fbird%2Fwebhook%2Froute.ts&appDir=D%3A%5CNew%20folder%5Ctwilio_new%5Ctwilio_chat%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5CNew%20folder%5Ctwilio_new%5Ctwilio_chat&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fbird%2Fwebhook%2Froute&page=%2Fapi%2Fbird%2Fwebhook%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fbird%2Fwebhook%2Froute.ts&appDir=D%3A%5CNew%20folder%5Ctwilio_new%5Ctwilio_chat%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5CNew%20folder%5Ctwilio_new%5Ctwilio_chat&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var D_New_folder_twilio_new_twilio_chat_app_api_bird_webhook_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/bird/webhook/route.ts */ \"(rsc)/./app/api/bird/webhook/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/bird/webhook/route\",\n        pathname: \"/api/bird/webhook\",\n        filename: \"route\",\n        bundlePath: \"app/api/bird/webhook/route\"\n    },\n    resolvedPagePath: \"D:\\\\New folder\\\\twilio_new\\\\twilio_chat\\\\app\\\\api\\\\bird\\\\webhook\\\\route.ts\",\n    nextConfigOutput,\n    userland: D_New_folder_twilio_new_twilio_chat_app_api_bird_webhook_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZiaXJkJTJGd2ViaG9vayUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGYmlyZCUyRndlYmhvb2slMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZiaXJkJTJGd2ViaG9vayUyRnJvdXRlLnRzJmFwcERpcj1EJTNBJTVDTmV3JTIwZm9sZGVyJTVDdHdpbGlvX25ldyU1Q3R3aWxpb19jaGF0JTVDYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj1EJTNBJTVDTmV3JTIwZm9sZGVyJTVDdHdpbGlvX25ldyU1Q3R3aWxpb19jaGF0JmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PXN0YW5kYWxvbmUmcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDMEI7QUFDdkc7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkQ6XFxcXE5ldyBmb2xkZXJcXFxcdHdpbGlvX25ld1xcXFx0d2lsaW9fY2hhdFxcXFxhcHBcXFxcYXBpXFxcXGJpcmRcXFxcd2ViaG9va1xcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJzdGFuZGFsb25lXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2JpcmQvd2ViaG9vay9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2JpcmQvd2ViaG9va1wiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvYmlyZC93ZWJob29rL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiRDpcXFxcTmV3IGZvbGRlclxcXFx0d2lsaW9fbmV3XFxcXHR3aWxpb19jaGF0XFxcXGFwcFxcXFxhcGlcXFxcYmlyZFxcXFx3ZWJob29rXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fbird%2Fwebhook%2Froute&page=%2Fapi%2Fbird%2Fwebhook%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fbird%2Fwebhook%2Froute.ts&appDir=D%3A%5CNew%20folder%5Ctwilio_new%5Ctwilio_chat%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5CNew%20folder%5Ctwilio_new%5Ctwilio_chat&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "tty":
/*!**********************!*\
  !*** external "tty" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tty");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/axios","vendor-chunks/@opentelemetry","vendor-chunks/asynckit","vendor-chunks/math-intrinsics","vendor-chunks/es-errors","vendor-chunks/form-data","vendor-chunks/call-bind-apply-helpers","vendor-chunks/debug","vendor-chunks/get-proto","vendor-chunks/has-symbols","vendor-chunks/gopd","vendor-chunks/function-bind","vendor-chunks/follow-redirects","vendor-chunks/supports-color","vendor-chunks/proxy-from-env","vendor-chunks/ms","vendor-chunks/hasown","vendor-chunks/has-tostringtag","vendor-chunks/has-flag","vendor-chunks/get-intrinsic","vendor-chunks/es-set-tostringtag","vendor-chunks/es-object-atoms","vendor-chunks/es-define-property","vendor-chunks/dunder-proto","vendor-chunks/delayed-stream","vendor-chunks/combined-stream"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fbird%2Fwebhook%2Froute&page=%2Fapi%2Fbird%2Fwebhook%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fbird%2Fwebhook%2Froute.ts&appDir=D%3A%5CNew%20folder%5Ctwilio_new%5Ctwilio_chat%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5CNew%20folder%5Ctwilio_new%5Ctwilio_chat&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();