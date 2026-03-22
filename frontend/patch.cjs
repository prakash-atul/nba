const fs = require('fs');
let code = fs.readFileSync('src/components/hod/FacultyManagement.tsx', 'utf8');

const regexAdd = /<div className="space-y-2">\s*<Label htmlFor="phone">Phone<\/Label>[\s\S]*?<\/div>/;

const newAdd = `<div className="space-y-2">
								<Label>Phone Numbers</Label>
								{(formData.phones?.length ? formData.phones : [""]).map((phone, idx) => (
									<div key={idx} className="flex items-center gap-2">
										<Input
											type="tel"
											maxLength={10}
											pattern="\\d{10}"
											placeholder="e.g., 9876543210"
											value={phone}
											onChange={(e) => {
												const val = e.target.value.replace(/\\D/g, "");
												const newPhones = [...(formData.phones || [])];
												newPhones[idx] = val;
												setFormData({ ...formData, phones: newPhones });
											}}
										/>
										{(formData.phones?.length ? formData.phones.length : 1) > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="text-red-500 hover:text-red-700 hover:bg-red-50"
												onClick={() => {
													const newPhones = (formData.phones || []).filter((_, i) => i !== idx);
													if (newPhones.length === 0) newPhones.push("");
													setFormData({ ...formData, phones: newPhones });
												}}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										)}
									</div>
								))}
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="w-full mt-2"
									onClick={() => {
										setFormData({
											...formData,
											phones: [...(formData.phones || []), ""],
										});
									}}
								>
									<Plus className="w-4 h-4 mr-2" />
									Add Phone Number
								</Button>
							</div>`;

code = code.replace(regexAdd, newAdd);

const regexEdit = /<div className="space-y-2">\s*<Label htmlFor="edit_phone">Phone<\/Label>[\s\S]*?<\/div>\s*<\/div>\s*<div className="space-y-2">\s*<Label htmlFor="edit_password">/;

const newEdit = `<div className="space-y-2">
								<Label>Phone Numbers</Label>
								{(editFormData.phones?.length ? editFormData.phones : [""]).map((phone, idx) => (
									<div key={idx} className="flex items-center gap-2">
										<Input
											type="tel"
											maxLength={10}
											pattern="\\d{10}"
											placeholder="e.g., 9876543210"
											value={phone}
											onChange={(e) => {
												const val = e.target.value.replace(/\\D/g, "");
												const newPhones = [...(editFormData.phones || [])];
												newPhones[idx] = val;
												setEditFormData({ ...editFormData, phones: newPhones });
											}}
										/>
										{(editFormData.phones?.length ? editFormData.phones.length : 1) > 1 && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="text-red-500 hover:text-red-700 hover:bg-red-50"
												onClick={() => {
													const newPhones = (editFormData.phones || []).filter((_, i) => i !== idx);
													if (newPhones.length === 0) newPhones.push("");
													setEditFormData({ ...editFormData, phones: newPhones });
												}}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										)}
									</div>
								))}
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="w-full mt-2"
									onClick={() => {
										setEditFormData({
											...editFormData,
											phones: [...(editFormData.phones || []), ""],
										});
									}}
								>
									<Plus className="w-4 h-4 mr-2" />
									Add Phone Number
								</Button>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit_password">`;

code = code.replace(regexEdit, newEdit);

fs.writeFileSync('src/components/hod/FacultyManagement.tsx', code);
