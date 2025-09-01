import React, { useState, useEffect } from 'react';
/*import { useNavigate } from 'react-router-dom';*/
import db from "../firebase.js";
import { collection, doc, setDoc, query, orderBy, limit, getDoc, getDocs } from "firebase/firestore";
import ValidationPage from './NewValidationPage.jsx';


const ReceivingReport = () => {
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [quantityAccepted, setQuantityAccepted] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');
  const [receivingReportNo, setReceivingReportNo] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [assetType, setAssetType] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [modeOfAcquisition, setModeOfAcquisition] = useState('');
  const [others, setOthers] = useState('');
  const [purchaseOrderNo, setPurchaseOrderNo] = useState('');
  const [poSuggestions, setPoSuggestions] = useState([]);
  const [showPoSuggestions, setShowPoSuggestions] = useState(false);
  // Fetch PO suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!purchaseOrderNo) {
        setPoSuggestions([]);
        return;
      }
      try {
        const snapshot = await getDocs(collection(db, "Purchase Order"));
        const allPOs = snapshot.docs.map(doc => doc.id);
        // Match if PO number contains the input (case-insensitive)
        const filtered = allPOs.filter(po => po.toLowerCase().includes(purchaseOrderNo.toLowerCase()));
        setPoSuggestions(filtered.slice(0, 5)); // limit to 5 suggestions
      } catch (error) {
        setPoSuggestions([]);
      }
    };
    if (showPoSuggestions) fetchSuggestions();
  }, [purchaseOrderNo, showPoSuggestions]);
{/*    const navigate = useNavigate('');*/}

    // Set the current date on page load
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setCurrentDate(today);
    }, []);

    const fetchLastReportNo = async () => {
        try {
            const reportQuery = query(
                collection(db, "Receiving Report"),
                orderBy("receivingReportNo", "desc"),
                limit(1)
            );
            const querySnapshot = await getDocs(reportQuery);
            if (!querySnapshot.empty) {
                const lastReport = querySnapshot.docs[0].data();
                const lastReportNo = parseInt(lastReport.receivingReportNo, 10);
                setReceivingReportNo((lastReportNo + 1).toString());
            } else {
                setReceivingReportNo("1000");  // Set starting number if no previous report exists
            }
        } catch (error) {
            console.error("Error fetching last report number:", error);
        }
    };

    // Generate the Receiving Report No on page load
    useEffect(() => {
        fetchLastReportNo();
    }, []);

    const addItem = () => {
        if (!itemName || !quantityAccepted || !unitCost) {
            alert("Please fill in all required fields!");
            return;
        }
        
        const totalCost = quantityAccepted * unitCost;
        const newItem = {
            itemName,
            quantityAccepted,
            unit,
            unitCost,
            totalCost,
            description,
            assetType,
            department,
            modeOfAcquisition,
            status,
            others
        };
    
        setItems(prevItems => [...prevItems, newItem]);
    
        // Clear inputs after adding item
        setItemName('');
        setQuantityAccepted('');
        setUnitCost('');
        setUnit('Pc');
        setDescription('');
        setAssetType('');
        setDepartment('');
        setModeOfAcquisition('Purchase');
        setStatus('');
        setOthers('');
    };

    const clearItems = () => {
      {/*const confirmClear = window.confirm("Are you sure you want to clear all items?");
      if (confirmClear) {
        setItems([]);
      }*/}
      setItems([]);
    };

    const handleSubmit = async () => {
        if (!purchaseOrderNo) {
            alert("Please enter a Purchase Order No.");
            return;
        }

        try {
            const poDocRef = doc(db, "Purchase Order", purchaseOrderNo);
            const poDocSnap = await getDoc(poDocRef);
    
            if (!poDocSnap.exists()) {
                alert(`Purchase Order No "${purchaseOrderNo}" not found in the database.`);
                return;
            }
    
            const data = {
                receivingReportNo,
                purchaseOrderNo,
                items,
                currentDate,
                status: "Pending"
            };

            await setDoc(doc(db, "Receiving Report", receivingReportNo), data);
            alert("Receiving Report saved successfully!");
            setItems([]);
            setPurchaseOrderNo('');
            await fetchLastReportNo();
            {/*navigate ('/NewValidatePage');*/}
        } catch (error) {
            console.error("Error saving document: ", error);
            alert("Error saving to Firestore");
        }
    };

    const preventNumberInput = (e) => {
        if (!isNaN(e.key) && e.key !== ' ') {
            e.preventDefault();
        }
    };
    
    const preventInvalidInput = (e) => {
        if (["e", "E", "+", "-"].includes(e.key)) {
            e.preventDefault();
        }
    };

  return(
    <>
      <div className='grid grid-cols-5 lg:grid-cols-8 gap-4 mt-5 lg:ml-1.5 px-4'>

        {/*Input information for items section, Upper Square*/ }
        <div className='bg-white col-span-4 col-start-1  lg:col-start-3  mt-2 w-230 h-150 items-center rounded-lg border-2 border-black-500 ml-3 mt-3'>
          <h1 className='text-6xl text-[#023047] font-bold ml-10 mt-10'>Receiving Report</h1>
          <h4 className='text-md text-[#023047] font-semibold ml-10 mt-10'>Report Details</h4>

          <div className='grid grid-cols-6 gap-5 mt-5 ml-10 mr-10'>
            <div className='col-start-1 flex mr-2'>
              <label className='text-black  font-semibold flex-none pl-7 pt-1 mr-2.5'>RR No:</label>
              <input type='text' className='text-center text-gray-500 border border-gray-300 rounded-lg ml-2 h-8 w-26 flex-initial' id='receivingReportNo' value={receivingReportNo} disabled />
            </div>

            <div className='col-start-2 flex'>
              <label className='text-black font-semibold flex-none pl-20.5 mr-3'>PO No:</label>
              <div className="relative w-full">
                <input
                  type='text'
                  className='border border-gray-300 rounded-lg p-2 pl-5 h-7.5 w-40 flex-initial'
                  id='purchaseOrderNo'
                  value={purchaseOrderNo}
                  autoComplete='off'
                  onFocus={() => setShowPoSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowPoSuggestions(false), 150)}
                  onChange={e => {
                    setPurchaseOrderNo(e.target.value);
                    setShowPoSuggestions(true);
                  }}
                />
                {showPoSuggestions && poSuggestions.length > 0 && (
                  <ul className="absolute z-10 bg-white border border-gray-300 w-40 max-h-40 overflow-y-auto mt-1 rounded-lg shadow-lg">
                    {poSuggestions.map((po, idx) => (
                      <li
                        key={po}
                        className={
                          `px-4 py-2 cursor-pointer hover:bg-blue-100 text-gray-800 w-35 ${idx !== poSuggestions.length - 1 ? 'border-b border-gray-100' : ''}`
                        }
                        onMouseDown={() => {
                          setPurchaseOrderNo(po);
                          setShowPoSuggestions(false);
                        }}
                      >
                        {po}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className='col-start-5 flex '>
              <label className='text-black font-semibold flex-none pl-16.5 mr-1.5'>Date:</label>
              <input type='date' className='border border-gray-300 rounded-lg p-2 h-7 flex-initial ' id='dateReceived' value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} />
            </div>

            <div className='col-start-1 col-span-3 flex'>
              <label className='text-black font-semibold flex-none mr-2'>Asset Type:</label>
              <input type='text' className='border border-gray-300 rounded-lg p-2 h-7 w-125 flex-initial' id='assetType' value={assetType} onChange={(e) => setAssetType(e.target.value)} onKeyDown={preventNumberInput} />
            </div>

            <div className='col-start-4 col-span-3 flex'>
              <label className='text-black font-semibold flex-none mr-2'>Department:</label>
              <input type='text' className='border border-gray-300 rounded-lg p-2 h-7 w-137 flex-initial' id='department' value={department} onChange={(e) => setDepartment(e.target.value)} onKeyDown={preventNumberInput}/>
            </div>

            <div className='col-start-1 col-span-3 flex'>
              <label className='text-black font-semibold flex-none mr-2'>Mode of Acquisition:</label>
              <select className='border border-gray-300 rounded-lg  h-7 w-200 flex-initial' id='modeOfAcquisition' value={modeOfAcquisition} onChange={(e) => { const value = e.target.value; setModeOfAcquisition(value); if (value !== "Other") { setOthers(''); } }} onKeyDown={preventNumberInput}>
                <option value=''>---</option>
                <option value='Purchase'>Purchase</option>
                <option value='Lease'>Lease</option>
                <option value='Donation'>Donation</option>
                <option value='Other'>Other</option>
              </select>
            </div>

            <div className='col-start-4 col-span-3 flex'>
              <label className='text-black font-semibold flex-none mr-2'>Other:</label>
              <input
                type='text'
                className={`border border-gray-300 rounded-lg p-2 h-7 w-200 flex-initial ${modeOfAcquisition !== 'Other' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
                id="others"
                value={others}
                onChange={(e) => setOthers(e.target.value)}
                onKeyDown={preventNumberInput}
                disabled={modeOfAcquisition !== 'Other'}
              />
            </div>
          </div>

          <div className='grid grid-cols-8 gap-2'>
            <div className='col-start-1 col-span-4'>
              <h4 className='text-md text-black font-semibold ml-10 mt-10'>Item Details </h4>
            </div>
            

            <div className='col-start-1 col-span-4 mt-5'>
              <label className='text-black font-semibold flex-none pl-9.75 pr-2'>Item:</label>
              <input type='text' className='border border-gray-300 rounded-lg p-2 h-7 w-80 flex-initial' id='itemName' value={itemName} onChange={(e) => setItemName(e.target.value)}/>
            </div>

            <div className='col-start-5 col-span-4 mt-5'>
              <label className='text-black font-semibold flex-none pr-2.5'>Description:</label>
              <input type='text' className='border border-gray-300 rounded-lg p-2 h-7 w-78 flex-initial' id='description' value={description} onChange={(e) => setDescription(e.target.value)}/>
            </div>

            <div className='col-start-1 col-span-2 pt-4'>
              <label className='text-black font-semibold flex-none pl-9.75 pr-2'>Quantity:</label>
              <input type='number' className='border border-gray-300 rounded-lg p-2 h-7 w-25 flex-initial' id='quantityAccepted' value={quantityAccepted} onChange={(e) => setQuantityAccepted (e.target.value)} onKeyDown={preventInvalidInput}/>
            </div>

            <div className='col-start-3  col-span-2 pt-4 pl-6.5'>
              <label className='text-black font-semibold flex-none pr-3'>Unit:</label>
              <select className='border border-gray-300 rounded-lg text-sm text-gray-500 h-7 w-25 flex-initial pl-1' id='unit' value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value=''>Select Unit</option>
                <option value='Pc'>Pc</option>
                <option value='Box'>Box</option>
                <option value='Kg'>Kg</option>
                <option value='L'>L</option>
              </select>
            </div>

            <div className=' inline-flex col-start-5 col-span-2 pt-4'>
              <label className='text-black font-semibold flex-none pr-2'>Unit Cost:</label>
              <input type='number' className='border border-gray-300 rounded-lg p-2 h-7 w-25 flex-initial' id='unitCost' value={unitCost} onChange={(e) => setUnitCost(e.target.value)}/>
            </div>

            <div className='col-start-7  col-span-2 pt-4'>
              <label className='text-black font-semibold flex-none pr-2'>Status:</label>
              <select className='border border-gray-300 rounded-lg h-7 w-30 flex-initial text-gray-500 text-sm pl-1' id='status' value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value=''>Select Status</option>
                <option value='Accepted'>Completed</option>
                <option value='Rejected'>Rejected</option>
                <option value='Pending'>Pending</option>
              </select>
            </div>

            <div className='col-start-6 col-span-2 pt-7.5 pl-20'>
              <button className="bg-[#023047] hover:bg-gray-600 text-white border border-[#023047] font-bold py-2 px-4 rounded-full w-40 shadow-md" onClick={addItem}>
                Add item
              </button>
            </div>
          </div>
        </div>


        {/*List of Items, Bottom Square*/ }
        <div className='bg-white-200 col-span-4 col-start-1 lg:col-start-3 text center mt-2 w-230 h-150 items-center rounded-lg border-2 border-black-200 ml-3 mt-2 mb-5'>
        <div className='grid grid-cols-4 gap-3'>
          <div className='col-span-2 col-start-1'>
            <h3 className='text-2xl text-[#023047] text-left font-bold m-10 '>List of Items</h3>
          </div>
          <div className='col-start-3'>
            <button className="bg-[#023047] hover:bg-gray-600 text-white border border-[#023047] mt-9 ml-48 font-bold py-2 px-4 rounded-full h-12 w-40 shadow-md" onClick={clearItems}>
                Clear Items
            </button>
          </div>
        </div>
          
          
          <div class='overflow-y-scroll overscroll-none h-90'>
            <table class='border solid border-gray-200 border-collapse table-auto w-full text-sm text-left text-[#023047]'>
              <thead class='text-xs text-white uppercase bg-[#023047]'>
                <tr>
                  <th scope='col' class='px-6 py-3'>Item</th>
                  <th scope='col' class='px-6 py-3'>Description</th>
                  <th scope='col' class='px-6 py-3'>Quantity</th>
                  <th scope='col' class='px-6 py-3'>Unit</th>
                  <th scope='col' class='px-6 py-3'>Unit Cost</th>
                  <th scope='col' class='px-6 py-3'>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td className='px-6 py-4'>No item(s) added yet.</td></tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className='even:bg-gray-100 odd:bg-white'>
                      <td className='px-6 py-4'>{item.itemName}</td>
                      <td className='px-6 py-4'>{item.itemDescription}</td>
                      <td className='px-6 py-4'>{item.unit}</td>
                      <td className='px-6 py-4'>{item.unitCost}</td>
                      <td className='px-6 py-4'>{item.unitCost}</td>
                      <td className='px-6 py-4'>{item.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className='flex justify-center mt-5 grid grid-cols-4'>
            <button className='col-start-4 bg-[#023047] hover:bg-gray-500 text-white font-bold py-2 px-4 border border-[#023047] rounded-full w-40 shadow-md' onClick={handleSubmit}>
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ReceivingReport;