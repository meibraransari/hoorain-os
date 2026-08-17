const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../src/app/(dashboard)');

function removeAccountsFromPopup(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // The accounts block looks like:
  //                 {/* Available Accounts List */}
  //                 {accounts.length > 0 && (
  //                    ...
  //                 )}
  //               </div>
  //             )}
  //           </div>
  // Let's replace the whole chunk from {/* Available Accounts List */} down to the matching </div>)}
  const startMarker = '{/* Available Accounts List */}';
  
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) {
     console.log(`Marker not found in ${filePath}`);
     return;
  }
  
  const before = content.substring(0, startIndex);
  
  // Find the end of the accounts block.
  // It is followed by `              </div>\n            )}\n          </div>` which closes the popover.
  // We can just find the end of the `accounts.map` block.
  
  const endMarkerStr = `                  </div>\r\n                )}\r\n              </div>`;
  const endMarkerStrAlt = `                  </div>\n                )}\n              </div>`;
  
  let endIndex = content.indexOf(endMarkerStr, startIndex);
  let lengthToSkip = endMarkerStr.length;
  if (endIndex === -1) {
    endIndex = content.indexOf(endMarkerStrAlt, startIndex);
    lengthToSkip = endMarkerStrAlt.length;
  }
  
  if (endIndex === -1) {
    console.log(`End marker not found in ${filePath}. Let's try simpler regex.`);
    const fallbackRegex = /\{\/\* Available Accounts List \*\/\}[\s\S]*?\{\/\* Available Accounts List End \*\/\}?/g;
    
    // We can just slice out between startIndex and the `</div>` that closes the popover.
    const rest = content.substring(startIndex);
    const popoverCloseIndex = rest.indexOf('              </div>\n            )}\n          </div>');
    if (popoverCloseIndex !== -1) {
      content = before + rest.substring(popoverCloseIndex);
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath} using substring fallback`);
      return;
    }
    
    const popoverCloseIndex2 = rest.indexOf('              </div>\r\n            )}\r\n          </div>');
    if (popoverCloseIndex2 !== -1) {
      content = before + rest.substring(popoverCloseIndex2);
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath} using substring fallback (CRLF)`);
      return;
    }
    console.log("Could not parse end boundary.");
    return;
  }
  
  // Keep the popover close tags
  const after = content.substring(endIndex + lengthToSkip - 18); // rough hack
  
  // Instead of hack, let's just use string replace for the whole section:
  const sectionStr = content.substring(startIndex, endIndex + lengthToSkip);
  content = content.replace(sectionStr, '              </div>\n');
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

removeAccountsFromPopup(path.join(root, 'dashboard-analytics/page.tsx'));
removeAccountsFromPopup(path.join(root, 'dashboard-planning/page.tsx'));

console.log("Accounts removed from popup.");
